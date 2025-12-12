import tcpping from 'tcp-ping';
import config from './config.js';

/**
 * 验证单个节点
 * @param {object} node 
 * @returns {Promise<object>} 带有人延迟信息的节点对象，如果失败 delay 为 -1
 */
export function pingNode(node) {
    return new Promise((resolve) => {
        if (!node.port || !node.add) {
            node.delay = -1;
            return resolve(node);
        }

        tcpping.ping({
            address: node.add,
            port: Number(node.port),
            attempts: config.validator.attempts,
            timeout: config.validator.timeout
        }, (err, data) => {
            if (err || isNaN(data.avg)) {
                node.delay = -1;
            } else {
                node.delay = Math.round(data.avg);
            }
            resolve(node);
        });
    });
}

/**
 * 批量验证节点
 * @param {object[]} nodes 
 * @returns {Promise<object[]>} 只返回可用的节点
 */
export async function validateNodes(nodes) {
    console.log(`Starting validation for ${nodes.length} nodes...`);
    const results = [];
    const concurrency = config.validator.concurrent;

    // 分批处理以控制并发
    for (let i = 0; i < nodes.length; i += concurrency) {
        const chunk = nodes.slice(i, i + concurrency);
        const promises = chunk.map(node => pingNode(node));
        const chunkResults = await Promise.all(promises);
        results.push(...chunkResults);
    }

    const validNodes = results.filter(n => n.delay > 0 && n.delay < 3000);
    console.log(`Validation complete. ${validNodes.length}/${nodes.length} nodes are valid.`);
    return validNodes;
}
