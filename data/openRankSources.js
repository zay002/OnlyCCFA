const openRankSources = {
  sources: {
    ei: { label: "EI", className: "rank-source-ei" },
    sci: { label: "SCI", className: "rank-source-sci" },
    casBase: { label: "中科院基础", className: "rank-source-cas" },
    casUpgraded: { label: "中科院升级", className: "rank-source-cas" },
    casTop: { label: "中科院TOP", className: "rank-source-top" },
    casWarning: { label: "中科院预警", className: "rank-source-warning" },
    pkuCore: { label: "北大核心", className: "rank-source-cn" },
    cscd: { label: "CSCD", className: "rank-source-cn" },
    cssci: { label: "CSSCI", className: "rank-source-cn" },
    swufe: { label: "西南财大", className: "rank-source-school" },
    swjtu: { label: "西南交大", className: "rank-source-school" },
  },
  records: [
    {
      title: "Proceedings of the IEEE",
      aliases: ["PROC IEEE", "PROCEEDINGS IEEE"],
      tags: [
        { source: "sci" },
        { source: "casUpgraded", value: "1区" },
        { source: "casTop", value: "TOP" },
      ],
    },
    {
      title: "IEEE Transactions on Pattern Analysis and Machine Intelligence",
      aliases: ["TPAMI", "IEEE TPAMI"],
      tags: [
        { source: "sci" },
        { source: "casUpgraded", value: "1区" },
        { source: "casTop", value: "TOP" },
        { source: "ei" },
      ],
    },
    {
      title: "International Journal of Computer Vision",
      aliases: ["IJCV"],
      tags: [
        { source: "sci" },
        { source: "casUpgraded", value: "1区" },
        { source: "casTop", value: "TOP" },
      ],
    },
    {
      title: "Pattern Recognition",
      aliases: ["PATTERN RECOGN"],
      tags: [
        { source: "sci" },
        { source: "casUpgraded", value: "2区" },
        { source: "ei" },
      ],
    },
    {
      title: "Information Sciences",
      aliases: ["INFORMATION SCIENCES"],
      tags: [
        { source: "sci" },
        { source: "casUpgraded", value: "1区" },
        { source: "ei" },
      ],
    },
    {
      title: "Knowledge-Based Systems",
      aliases: ["KNOWLEDGE BASED SYSTEMS"],
      tags: [
        { source: "sci" },
        { source: "casUpgraded", value: "1区" },
        { source: "ei" },
      ],
    },
    {
      title: "IEEE/CVF Conference on Computer Vision and Pattern Recognition",
      aliases: ["CVPR", "Computer Vision and Pattern Recognition"],
      tags: [{ source: "ei" }],
    },
    {
      title: "International Conference on Computer Vision",
      aliases: ["ICCV"],
      tags: [{ source: "ei" }],
    },
    {
      title: "European Conference on Computer Vision",
      aliases: ["ECCV"],
      tags: [{ source: "ei" }],
    },
    {
      title: "Neural Information Processing Systems",
      aliases: ["NeurIPS", "NIPS"],
      tags: [{ source: "ei" }],
    },
    {
      title: "计算机学报",
      tags: [{ source: "pkuCore" }, { source: "cscd" }, { source: "swjtu" }],
    },
    {
      title: "软件学报",
      tags: [{ source: "pkuCore" }, { source: "cscd" }, { source: "swjtu" }],
    },
    {
      title: "自动化学报",
      tags: [{ source: "pkuCore" }, { source: "cscd" }, { source: "swjtu" }],
    },
    {
      title: "计算机研究与发展",
      tags: [{ source: "pkuCore" }, { source: "cscd" }, { source: "swjtu" }],
    },
    {
      title: "电子学报",
      tags: [{ source: "pkuCore" }, { source: "cscd" }],
    },
    {
      title: "通信学报",
      tags: [{ source: "pkuCore" }, { source: "cscd" }],
    },
    {
      title: "管理世界",
      tags: [{ source: "pkuCore" }, { source: "cssci" }, { source: "swufe" }],
    },
    {
      title: "经济研究",
      tags: [{ source: "pkuCore" }, { source: "cssci" }, { source: "swufe" }],
    },
    {
      title: "中国工业经济",
      tags: [{ source: "pkuCore" }, { source: "cssci" }, { source: "swufe" }],
    },
    {
      title: "金融研究",
      tags: [{ source: "pkuCore" }, { source: "cssci" }, { source: "swufe" }],
    },
  ],
};
