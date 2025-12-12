import { Buffer } from 'buffer';
import yaml from 'js-yaml';

/**
 * 解析 Base64 编码的订阅内容
 * @param {string} content 
 * @returns {string[]} 解码后的节点链接列表 (vmess://, vless://, ss://)
 */
export function decodeSubscription(content) {
    try {
        // 部分订阅内容可能包含回车换行，需要清理
        const cleaned = content.trim().replace(/\s/g, '');
        const decoded = Buffer.from(cleaned, 'base64').toString('utf-8');
        return decoded.split(/[\r\n]+/).filter(line => line.trim().length > 0);
    } catch (error) {
        console.error('Base64 decode failed:', error.message);
        return [];
    }
}

/**
 * 从文本中通过正则提取节点链接
 * @param {string} text 
 * @returns {string[]}
 */
export function extractLinks(text) {
    // 简单的正则匹配 vmess://, vless://, ss://, trojan://
    const regex = /(vmess|vless|ss|trojan):\/\/[a-zA-Z0-9\+\/=\-_]+/g;
    const matches = text.match(regex) || [];
    return matches;
}

/**
 * 解析单个节点链接为对象 (简化版，用于后续去重或验证)
 * 注意: 完整解析协议很复杂，这里主要为了获取 ID/IP/Port 做去重
 * @param {string} link 
 */
export function parseNode(link) {
    if (link.startsWith('vmess://')) {
        return parseVmess(link);
    } else if (link.startsWith('ss://')) {
        // TODO: 实现 SS 解析
        return { type: 'ss', original: link };
    } else if (link.startsWith('vless://')) {
        // TODO: 实现 VLESS 解析
        return { type: 'vless', original: link };
    }
    return { type: 'unknown', original: link };
}

function parseVmess(link) {
    try {
        const base64Part = link.replace('vmess://', '');
        const jsonStr = Buffer.from(base64Part, 'base64').toString('utf-8');
        const config = JSON.parse(jsonStr);
        return {
            type: 'vmess',
            ps: config.ps,
            add: config.add,
            port: config.port,
            id: config.id,
            original: link,
            config: config
        };
    } catch (e) {
        return { type: 'vmess', error: 'parse_error', original: link };
    }
}

/**
 * 解析 Clash YAML 内容提取节点
 * @param {string} yamlContent 
 * @returns {object[]} Proxies list
 */
export function parseClash(yamlContent) {
    try {
        const doc = yaml.load(yamlContent);
        if (doc && Array.isArray(doc.proxies)) {
            return doc.proxies.map(p => {
                // 转换为内部通用格式，或者直接保留 clash 格式供后续处理
                // 这里为了简单，我们标记它为 'clash' 类型，直接保留原始对象
                return {
                    type: 'clash_proxy',
                    name: p.name,
                    server: p.server,
                    port: p.port,
                    original: p // 保留原始对象以便恢复
                };
            });
        }
    } catch (e) {
        console.error('Failed to parse YAML:', e.message);
    }
    return [];
}
