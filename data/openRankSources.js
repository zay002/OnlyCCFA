const openRankSources = {
  sources: {
    ei: { label: "EI", className: "rank-source-ei" },
    sci: { label: "SCI", className: "rank-source-sci" },
    jcr: { label: "JCR", className: "rank-source-jcr" },
    casBase: { label: "中科院基础", className: "rank-source-cas" },
    casUpgraded: { label: "中科院升级", className: "rank-source-cas" },
    casTop: { label: "中科院TOP", className: "rank-source-top" },
    casWarning: { label: "中科院预警", className: "rank-source-warning" },
    pkuCore: { label: "北大核心", className: "rank-source-cn" },
    cscd: { label: "CSCD", className: "rank-source-cn" },
    cssci: { label: "CSSCI", className: "rank-source-cn" },
    swufe: { label: "西南财大", className: "rank-source-school" },
    swjtu: { label: "西南交大", className: "rank-source-school" },
    roboticsTop: { label: "机器人方向TOP", className: "rank-source-robotics" },
    controlTop: { label: "控制方向TOP", className: "rank-source-control" },
    mechTop: { label: "机械方向TOP", className: "rank-source-mech" },
    eeTop: { label: "电气方向TOP", className: "rank-source-ee" },
    commTop: { label: "通信方向TOP", className: "rank-source-comm" },
  },
  records: [
    {
      title: "Proceedings of the IEEE",
      aliases: ["PROC IEEE", "PROCEEDINGS IEEE"],
      tags: [
        { source: "sci" },
        { source: "jcr", value: "Q1" },
        { source: "casUpgraded", value: "1区" },
        { source: "casTop", value: "TOP" },
      ],
    },
    {
      title: "IEEE Transactions on Pattern Analysis and Machine Intelligence",
      aliases: ["TPAMI", "IEEE TPAMI"],
      tags: [
        { source: "sci" },
        { source: "jcr", value: "Q1" },
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
        { source: "jcr", value: "Q1" },
        { source: "casUpgraded", value: "1区" },
        { source: "casTop", value: "TOP" },
      ],
    },
    {
      title: "Pattern Recognition",
      aliases: ["PATTERN RECOGN"],
      tags: [
        { source: "sci" },
        { source: "jcr", value: "Q1" },
        { source: "casUpgraded", value: "2区" },
        { source: "ei" },
      ],
    },
    {
      title: "Information Sciences",
      aliases: ["INFORMATION SCIENCES"],
      tags: [
        { source: "sci" },
        { source: "jcr", value: "Q1" },
        { source: "casUpgraded", value: "1区" },
        { source: "ei" },
      ],
    },
    {
      title: "Knowledge-Based Systems",
      aliases: ["KNOWLEDGE BASED SYSTEMS"],
      tags: [
        { source: "sci" },
        { source: "jcr", value: "Q1" },
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
      title: "Conference on Robot Learning",
      aliases: ["CoRL"],
      tags: [{ source: "roboticsTop" }],
    },
    {
      title: "Robotics: Science and Systems",
      aliases: ["RSS"],
      tags: [{ source: "roboticsTop" }],
    },
    {
      title: "IEEE International Conference on Robotics and Automation",
      aliases: ["ICRA"],
      tags: [{ source: "roboticsTop" }, { source: "ei" }],
    },
    {
      title:
        "IEEE/RSJ International Conference on Intelligent Robots and Systems",
      aliases: ["IROS"],
      tags: [{ source: "roboticsTop" }, { source: "ei" }],
    },
    {
      title: "IEEE Transactions on Robotics",
      aliases: ["TRO", "IEEE T-RO", "IEEE T ROBOT"],
      tags: [
        { source: "roboticsTop" },
        { source: "sci" },
        { source: "jcr", value: "Q1" },
        { source: "casTop", value: "TOP" },
      ],
    },
    {
      title: "Journal of Mechanisms and Robotics",
      aliases: [
        "Journal of Mechanisms and Robotics-Transactions of the ASME",
        "ASME Journal of Mechanisms and Robotics",
      ],
      tags: [
        { source: "sci" },
        { source: "jcr", value: "Q2" },
        { source: "casUpgraded", value: "4区" },
      ],
    },
    {
      title: "The International Journal of Robotics Research",
      aliases: ["IJRR", "INTERNATIONAL JOURNAL OF ROBOTICS RESEARCH"],
      tags: [
        { source: "roboticsTop" },
        { source: "sci" },
        { source: "jcr", value: "Q1" },
        { source: "casTop", value: "TOP" },
      ],
    },
    {
      title: "IEEE Robotics and Automation Letters",
      aliases: ["RA-L", "RAL", "IEEE RA L"],
      tags: [
        { source: "roboticsTop" },
        { source: "sci" },
        { source: "jcr", value: "Q2" },
      ],
    },
    {
      title: "Science Robotics",
      tags: [
        { source: "roboticsTop" },
        { source: "sci" },
        { source: "jcr", value: "Q1" },
        { source: "casTop", value: "TOP" },
      ],
    },
    {
      title: "Automatica",
      tags: [
        { source: "controlTop" },
        { source: "sci" },
        { source: "jcr", value: "Q1" },
        { source: "casTop", value: "TOP" },
      ],
    },
    {
      title: "IEEE Transactions on Automatic Control",
      aliases: ["TAC", "IEEE TAC"],
      tags: [
        { source: "controlTop" },
        { source: "sci" },
        { source: "jcr", value: "Q1" },
        { source: "casTop", value: "TOP" },
      ],
    },
    {
      title: "IEEE Transactions on Industrial Electronics",
      aliases: ["TIE", "IEEE TIE"],
      tags: [
        { source: "eeTop" },
        { source: "sci" },
        { source: "jcr", value: "Q1" },
        { source: "casTop", value: "TOP" },
      ],
    },
    {
      title: "IEEE Transactions on Power Electronics",
      aliases: ["TPEL", "IEEE TPEL"],
      tags: [
        { source: "eeTop" },
        { source: "sci" },
        { source: "jcr", value: "Q1" },
        { source: "casTop", value: "TOP" },
      ],
    },
    {
      title: "IEEE Transactions on Smart Grid",
      aliases: ["TSG", "IEEE TSG"],
      tags: [
        { source: "eeTop" },
        { source: "sci" },
        { source: "jcr", value: "Q1" },
        { source: "casTop", value: "TOP" },
      ],
    },
    {
      title: "Journal of Mechanical Design",
      aliases: ["ASME Journal of Mechanical Design"],
      tags: [
        { source: "mechTop" },
        { source: "sci" },
        { source: "jcr", value: "Q2" },
      ],
    },
    {
      title: "Mechanical Systems and Signal Processing",
      aliases: ["MSSP"],
      tags: [
        { source: "mechTop" },
        { source: "sci" },
        { source: "jcr", value: "Q1" },
        { source: "casTop", value: "TOP" },
      ],
    },
    {
      title: "IEEE Journal on Selected Areas in Communications",
      aliases: ["JSAC", "IEEE JSAC"],
      tags: [
        { source: "commTop" },
        { source: "sci" },
        { source: "jcr", value: "Q1" },
        { source: "casTop", value: "TOP" },
      ],
    },
    {
      title: "IEEE Transactions on Wireless Communications",
      aliases: ["TWC", "IEEE TWC"],
      tags: [
        { source: "commTop" },
        { source: "sci" },
        { source: "jcr", value: "Q1" },
        { source: "casTop", value: "TOP" },
      ],
    },
    {
      title: "IEEE Transactions on Signal Processing",
      aliases: ["TSP", "IEEE TSP"],
      tags: [
        { source: "commTop" },
        { source: "sci" },
        { source: "jcr", value: "Q1" },
        { source: "casTop", value: "TOP" },
      ],
    },
    {
      title: "IEEE INFOCOM",
      aliases: ["INFOCOM", "IEEE Conference on Computer Communications"],
      tags: [{ source: "commTop" }, { source: "ei" }],
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
