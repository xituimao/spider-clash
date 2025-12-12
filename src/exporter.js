import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import config from './config.js';

/**
 * 确保输出目录存在
 */
function ensureDir() {
    if (!fs.existsSync(config.output.dir)) {
        fs.mkdirSync(config.output.dir, { recursive: true });
    }
}

/**
 * 将节点转换为 Clash Proxy 对象
 * @param {object} node 
 */
function toClashProxy(node) {
    if (node.type === 'vmess') {
        const proxy = {
            name: `${node.ps} - ${node.delay}ms`,
            type: 'vmess',
            server: node.add,
            port: Number(node.port),
            uuid: node.id,
            alterId: Number(node.config.aid || 0),
            cipher: node.config.scy || 'auto',
            tls: node.config.tls === 'tls',
            network: node.config.net || 'tcp',
        };
        
        // 处理 WS/GRPC 等传输配置
        if (node.config.net === 'ws') {
            proxy['ws-opts'] = {
                path: node.config.path || '/',
                headers: {
                    Host: node.config.host || node.add
                }
            };
        }
        return proxy;
    }
    // TODO: 支持其他协议 (VLESS, SS)
    return null;
}

/**
 * 导出为 Clash 配置文件
 * @param {object[]} nodes 
 * @param {string} fileName Optional filename override
 */
export async function exportClash(nodes, fileName = config.output.clashFileName) {
    ensureDir();
    const proxies = nodes.map(toClashProxy).filter(p => p !== null);
    
    if (proxies.length === 0) {
        console.log(`No valid proxies to export for Clash (${fileName}).`);
        return;
    }

    const clashConfig = {
        port: 7890,
        'socks-port': 7891,
        'allow-lan': true,
        mode: 'Rule',
        'log-level': 'info',
        'external-controller': '127.0.0.1:9090',
        proxies: proxies,
        'proxy-groups': [
            {
                name: 'Auto Select',
                type: 'url-test',
                proxies: proxies.map(p => p.name),
                url: 'http://www.gstatic.com/generate_204',
                interval: 300
            },
            {
                name: 'Proxy',
                type: 'select',
                proxies: ['Auto Select', ...proxies.map(p => p.name)]
            }
        ],
        rules: [
            'MATCH,Proxy'
        ]
    };

    const yamlStr = yaml.dump(clashConfig);
    const filePath = path.join(config.output.dir, fileName);
    fs.writeFileSync(filePath, yamlStr, 'utf8');
    console.log(`Clash config exported to ${filePath}`);
}

/**
 * 导出为 Base64 订阅文件
 * @param {object[]} nodes 
 * @param {string} fileName Optional filename override
 */
export async function exportSubscribe(nodes, fileName = config.output.subscribeFileName) {
    ensureDir();
    // 重新组合回 vmess:// 链接
    const links = nodes.map(node => node.original).join('\n');
    const base64Content = Buffer.from(links).toString('base64');
    
    const filePath = path.join(config.output.dir, fileName);
    fs.writeFileSync(filePath, base64Content, 'utf8');
    console.log(`Subscription file exported to ${filePath}`);
}

/**
 * 保存运行日志
 * @param {object} stats 
 */
export async function saveRunLog(stats) {
    ensureDir();
    const logDir = config.output.logDir;
    if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `run_${timestamp}.log`;
    const filePath = path.join(logDir, fileName);

    const logContent = `
=== Spider-Clash Run Log ===
Date: ${new Date().toISOString()}
Duration: ${stats.duration}ms

[Statistics]
Total Raw Links Found: ${stats.totalLinks}
Valid Format Nodes: ${stats.validFormatNodes}
Validated Available Nodes: ${stats.availableNodes}

[Errors]
${stats.errors.length > 0 ? stats.errors.join('\n') : 'None'}

[Config]
Sources: ${JSON.stringify(config.sources, null, 2)}
============================
`.trim();

    fs.writeFileSync(filePath, logContent, 'utf8');
    console.log(`Run log saved to ${filePath}`);
}

export async function saveResults(nodes) {
    await exportClash(nodes);
    await exportSubscribe(nodes);
}
