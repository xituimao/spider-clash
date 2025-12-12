export default {
    // 目标订阅源或网页列表
    sources: [
        // 示例: 'https://example.com/free-nodes',
        // 示例: 'vmess://....' (base64 文本内容的 URL)
        'https://oneclash.cc/a/*.html',
        'https://oneclash.cc/a/2312.html',
        'https://clashnodev2ray.github.io/',
        'https://clashnodev2ray.github.io/2025/12/12/free-ssr-node/',
        'https://github.com/free-nodes/v2rayfree',
        'https://freenode.openrunner.net/tag/v2ray/',
        'https://freenode.openrunner.net/post/20251212/',
        'https://www.cfmem.com/search/label/free',
        'https://clashgithub.com/category/freenode',
        'https://github.com/free-nodes/clashfree',
        'https://github.com/free18/v2ray',
        'https://github.com/Pawdroid/Free-servers',
        'https://github.com/John19187/v2ray-SSR-Clash-Verge-Shadowrocke',
        'https://github.com/Alvin9999/new-pac/wiki/v2ray%E5%85%8D%E8%B4%B9%E8%B4%A6%E5%8F%B7',
        'https://github.com/shaoyouvip/free',
        'https://github.com/hwanz/SSR-V2ray-Trojan-vpn'
    ],
    
    // 抓取设置
    crawler: {
        maxRequestsPerCrawl: 50,
        requestTimeoutSecs: 30,
        maxDepth: 2, // 爬取深度: 1=只爬当前页, 2=爬当前页+它包含的链接
    },

    // 验证设置
    validator: {
        timeout: 3000, // TCP ping 超时时间 (ms)
        attempts: 2,   // 重试次数
        concurrent: 20 // 并发验证数量
    },

    // 输出设置
    output: {
        dir: './output',
        clashFileName: 'clash.yaml',
        subscribeFileName: 'subscribe.txt',
        // 未验证的节点输出
        unvalidatedClashFileName: 'clash_all.yaml',
        unvalidatedSubscribeFileName: 'subscribe_all.txt',
        // 日志目录
        logDir: './output/logs'
    },

    // 定时任务 (Cron 表达式) - 默认每4小时运行一次
    cronSchedule: '0 */4 * * *'
};
