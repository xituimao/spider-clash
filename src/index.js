import config from './config.js';
import { crawlSources } from './crawler.js';
import { parseNode } from './parser.js';
import { validateNodes } from './validator.js';
import { saveResults, exportClash, exportSubscribe, saveRunLog } from './exporter.js';
import cron from 'node-cron';

async function runTask() {
    const startTime = Date.now();
    const stats = {
        totalLinks: 0,
        validFormatNodes: 0,
        availableNodes: 0,
        errors: [],
        duration: 0
    };

    console.log(`\n[${new Date().toISOString()}] Starting scheduled task...`);
    try {
        // 1. 抓取
        const links = await crawlSources();
        stats.totalLinks = links.length;

        if (links.length === 0) {
            console.log('No links found. Exiting task.');
            stats.duration = Date.now() - startTime;
            await saveRunLog(stats);
            return;
        }

        // 2. 解析
        console.log('Parsing nodes...');
        const nodes = links.map(link => parseNode(link));
        // 过滤掉无法解析的节点
        const validFormatNodes = nodes.filter(n => n.type !== 'unknown' && !n.error);
        stats.validFormatNodes = validFormatNodes.length;
        console.log(`Parsed ${validFormatNodes.length} valid format nodes.`);

        // 2.5 保存未验证的节点 (全部节点)
        console.log('Saving unvalidated nodes...');
        await exportClash(validFormatNodes, config.output.unvalidatedClashFileName);
        await exportSubscribe(validFormatNodes, config.output.unvalidatedSubscribeFileName);

        // 3. 验证
        const availableNodes = await validateNodes(validFormatNodes);
        stats.availableNodes = availableNodes.length;

        // 4. 保存 (验证后的可用节点)
        console.log('Saving validated nodes...');
        await saveResults(availableNodes);
        
        console.log(`Task completed successfully.`);
    } catch (error) {
        console.error('Task failed:', error);
        stats.errors.push(error.message);
    } finally {
        stats.duration = Date.now() - startTime;
        await saveRunLog(stats);
    }
}

// CLI 参数处理
const args = process.argv.slice(2);
const runOnce = args.includes('--run-once');

if (runOnce) {
    runTask();
} else {
    console.log(`Starting Node Crawler Service.`);
    console.log(`Schedule: ${config.cronSchedule}`);
    console.log('Press Ctrl+C to exit.');
    
    // 立即执行一次
    runTask();

    // 启动 Cron
    cron.schedule(config.cronSchedule, () => {
        runTask();
    });
}
