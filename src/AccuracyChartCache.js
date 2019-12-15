import Attempt from "./models/Attempt";
import Digit from "./models/Digit";

const chartInterval = 1000 * 60 * 60 * 2;
const chartRoundUp = 1000 * 60 * 60;

class AccuracyChartCache {

    constructor() {

    }

    async getAccuracyList() {
        let d = Date.now();
        d -= d % chartRoundUp;
        d -= 24 * chartInterval;
        let firstInWeek = await Attempt.where({'timestamp': {$gt: d}}).sort({_id: 1}).limit(1);
        let accuracyList = [];

        for (let i = 0; i < 12; i++) {
            d += chartInterval;

            let last = await Attempt.where({'timestamp': {$gt: d}}).sort({_id: 1}).limit(1);
            if (!last.length || last[0]._id === firstInWeek.id) {
                accuracyList.push(accuracyList[accuracyList.length - 1]);
                continue;
            }

            let acc = await Digit.aggregate([{
                $match: {
                    attempt: {$gte: firstInWeek[0]._id.toString(), $lte: last[0]._id.toString()}
                }
            }]).group({
                _id: 'total',
                accuracy: {
                    $avg: {$cond: ["$isInvalidRecognizing", 0, 1]}
                }
            });

            accuracyList.push(acc[0].accuracy);
        }

        return accuracyList;
    }

}

export default AccuracyChartCache;