import { CheerioCrawler } from 'crawlee';
import config from './config.js';
import { decodeSubscription, extractLinks, parseClash } from './parser.js';
import axios from 'axios';

/**
 * 抓取所有源并返回提取到的节点链接
 * @returns {Promise<string[]>} 原始节点链接列表
 */
export async function crawlSources() {
    const foundLinks = new Set();

    // 1. 预处理源：分离普通 URL 和 通配符 URL
    const directUrls = [];
    const pageUrls = [];
    const globs = [];

    config.sources.forEach(url => {
        if (url.includes('*')) {
            // 处理通配符，例如 https://oneclash.cc/a/*.html
            // 转换为 glob: https://oneclash.cc/a/*.html
            // 提取基础路径作为起始 URL: https://oneclash.cc/a/
            globs.push(url);
            
            // 简单的基础路径提取：截取到第一个 * 之前的最后一个 /
            const baseUrl = url.substring(0, url.indexOf('*'));
            const lastSlash = baseUrl.lastIndexOf('/');
            const startUrl = baseUrl.substring(0, lastSlash + 1);
            
            console.log(`Wildcard source detected: ${url} -> Start at: ${startUrl}`);
            pageUrls.push(startUrl);
        } else if (url.includes('subscribe') || url.includes('feed') || url.includes('.txt') || url.includes('.yaml')) {
            directUrls.push(url);
        } else {
            pageUrls.push(url);
        }
    });

    console.log(`Starting crawl. Direct: ${directUrls.length}, Pages: ${pageUrls.length}, Globs: ${globs.length}`);

    // 处理直接订阅链接
    for (const url of directUrls) {
        try {
            console.log(`Fetching subscription: ${url}`);
            const response = await axios.get(url, { timeout: 10000 });
            const content = response.data;
            if (typeof content === 'string') {
                const links = decodeSubscription(content) || [];
                if (links.length > 0) {
                    links.forEach(l => foundLinks.add(l));
                } else {
                    const extracted = extractLinks(content);
                    extracted.forEach(l => foundLinks.add(l));
                }
                
                // 尝试作为 YAML 解析
                const clashProxies = parseClash(content);
                clashProxies.forEach(p => foundLinks.add(p));
            }
        } catch (error) {
            console.error(`Failed to fetch ${url}: ${error.message}`);
        }
    }

    // 处理网页抓取
    if (pageUrls.length > 0) {
        const crawler = new CheerioCrawler({
            maxRequestsPerCrawl: config.crawler.maxRequestsPerCrawl,
            requestHandler: async ({ $, request, enqueueLinks }) => {
                console.log(`Scanning page: ${request.url}`);
                const text = $('body').text();
                const html = $('body').html();
                
                // 1. 从当前页面文本提取直接链接
                const linksFromText = extractLinks(text);
                [...linksFromText].forEach(link => foundLinks.add(link));

                // 2. 查找页面中的订阅文件链接 (.txt, .yaml, .yml)
                const subLinks = new Set();
                
                // A. 查找 a 标签
                $('a[href]').each((i, el) => {
                    const href = $(el).attr('href');
                    if (href && (href.endsWith('.txt') || href.endsWith('.yaml') || href.endsWith('.yml'))) {
                        subLinks.add(href);
                    }
                });

                // B. 查找文本中的 http 链接
                const urlRegex = /https?:\/\/[^\s"']+\.(txt|yaml|yml)/g;
                const textMatches = text.match(urlRegex) || [];
                textMatches.forEach(m => subLinks.add(m));

                console.log(`Found ${subLinks.size} potential subscription links on ${request.url}`);
                for (const subLink of subLinks) {
                    try {
                        console.log(`Fetching sub-link: ${subLink}`);
                        const response = await axios.get(subLink, { timeout: 10000 });
                        const content = response.data;
                        
                        if (subLink.endsWith('.yaml') || subLink.endsWith('.yml')) {
                            // TODO: 需要在 parser.js 中完善 parseClash 并在这里调用
                            // 目前仅支持文本里的 vmess 提取，如果 YAML 里是 standard proxies，extractLinks 可能拿不到
                            // 暂时尝试 regex 提取，如果 YAML 包含 vmess:// 写法
                            // 如果是 Clash Proxy Object，需要转换。
                            // 简化策略：如果是 YAML，尝试作为 clash 解析 (暂未完全实现转换回 vmess)
                            // 这里先尝试 extractLinks (针对 raw vmess) 和 decodeSubscription (针对 base64)
                        } 
                        
                        // 尝试作为 Base64 或明文列表解析
                        if (typeof content === 'string') {
                            const decoded = decodeSubscription(content);
                            if (decoded.length > 0) decoded.forEach(l => foundLinks.add(l));
                             
                            const extracted = extractLinks(content);
                            extracted.forEach(l => foundLinks.add(l));
                        }
                    } catch (err) {
                        console.error(`Failed to fetch sub-link ${subLink}: ${err.message}`);
                    }
                }
                // 3. 递归控制：检查深度
                const currentDepth = request.userData.depth || 1;
                if (currentDepth >= config.crawler.maxDepth) {
                    console.log(`Reached max depth (${currentDepth}) for ${request.url}`);
                    return;
                }

                // 4. 通配符模式匹配：如果有配置通配符，尝试从当前页面发现匹配的链接并入队
                if (globs.length > 0) {
                    await enqueueLinks({
                        globs: globs,
                        label: 'wildcard-match',
                        userData: {
                            depth: currentDepth + 1
                        }
                    });
                }
            },
        });

        await crawler.run(pageUrls);
    }

    console.log(`Crawl finished. Found ${foundLinks.size} unique links.`);
    return Array.from(foundLinks);
}
