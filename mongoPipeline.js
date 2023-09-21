
const optionsPipeline = [
    {
        $sort: {
            tradeId: -1,
        },
    },
    {
        $limit: 10,
    },
    {
        $group: {
            _id: '$contractType',
            totalVolume: { $sum: '$volume' },
            totalPremiumPriceInCents: { $sum: '$premiumPriceInCents' },
        },
    },
    {
        $project: {
            _id: 0,
            totalVolume: 1,
            totalPremiumPriceInCents: 1
        },
    },
];

module.exports = { optionsPipeline };
