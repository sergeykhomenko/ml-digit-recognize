const numberCrosses = (left, right) => {
    let slices = [
        left.toString().split(''), right.toString().split('')
    ], correctValuesCount = slices[0].length;

    for(let i = 0; i < slices[0].length; i++)
        slices[0][i] !== slices[1][i] && correctValuesCount--;

    return correctValuesCount / slices[0].length;
};

const crossAccuracyLimit = 0.65;
const dataTableDefaults = {
    searching: false,
    language: {
        paginate: {
            next: "Далее",
            previous: "Назад"
        }
    },
    columnDefs: [{render: data => `<img src="data:image/png;base64,${data}" height="40" />`, targets: 0}],
};

$('#attemptsTable').DataTable({
    ...dataTableDefaults,
    ajax: '/api/dashboard/attempts',
    createdRow: (row, data) => $(row).addClass(
        !!data[2] ? (
            numberCrosses(data[1], data[2]) > crossAccuracyLimit ? 'bg-warning' : 'bg-danger'
        ) : 'bg-success'
    ),
});

$('#digitsTable').DataTable({
    ...dataTableDefaults,
    ajax: '/api/dashboard/digits',
    createdRow: (row, data) => $(row).addClass(data[2] ? 'bg-danger' : 'bg-success'),
});
