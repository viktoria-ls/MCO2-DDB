$('#deleteBtn').on('click', () => {
    $.ajax({
        url: '/deleteMovie',
        type: 'POST',
        data: {
            id: $('#deleteSection').find("input[name='id']").val(),
            isolation: $('#deleteSection').find("input[name='isolation']").val()
        },
        success: (msg) => {
            clearAlerts();
            $('#deleteAlert').text(msg);
        },
        error: (msg) => {
            clearAlerts();
            $('#deleteAlert').text(msg);
        }
    });
});

$('#insertBtn').on('click', () => {
    var formData = {
        name: $('#insertSection').find("input[name='name']").val(),
        year: $('#insertSection').find("input[name='year']").val(),
        genre: $('#insertSection').find("input[name='genre']").val(),
        director: $('#insertSection').find("input[name='director']").val(),
        actor_1: $('#insertSection').find("input[name='actor_1']").val(),
        actor_2: $('#insertSection').find("input[name='actor_2']").val(),
        actor_3: $('#insertSection').find("input[name='actor_3']").val(),
        id: $('#insertSection').find("input[name='id']").val(),
        isolation: $('#insertSection').find("input[name='isolation']").val()
    }
    var cleanData = {};

    for(let i = 0; i < Object.keys(formData).length; i++) {
        var val = Object.values(formData)[i];
        if(val || val === 0)
            cleanData[Object.keys(formData)[i]] = val;
    }

    $.ajax({
        url: '/createMovie',
        type: 'POST',
        data: {...cleanData},
        success: (msg) => {
            clearAlerts();
            $('#insertAlert').text(msg);
        },
        error: (msg) => {
            clearAlerts();
            $('#insertAlert').text(msg);
        }
    });
});

$('#updateBtn').on('click', () => {
    var formData = {
        name: $('#updateSection').find("input[name='name']").val(),
        genre: $('#updateSection').find("input[name='genre']").val(),
        director: $('#updateSection').find("input[name='director']").val(),
        actor_1: $('#updateSection').find("input[name='actor_1']").val(),
        actor_2: $('#updateSection').find("input[name='actor_2']").val(),
        actor_3: $('#updateSection').find("input[name='actor_3']").val(),
        id: $('#updateSection').find("input[name='id']").val(),
        isolation: $('#updateSection').find("input[name='isolation']").val()
    }
    var cleanData = {};

    for(let i = 0; i < Object.keys(formData).length; i++) {
        var val = Object.values(formData)[i];
        if(val || val === 0)
            cleanData[Object.keys(formData)[i]] = val;
    }

    $.ajax({
        url: '/updateMovie',
        type: 'POST',
        data: {...cleanData},
        success: (msg) => {
            clearAlerts();
            $('#updateAlert').text(msg);
        },
        error: (msg) => {
            clearAlerts();
            $('#updateAlert').text(msg);
        }
    });
});

$('#searchBtn').on('click', () => {
    $.ajax({
        url: `/search/${$('#searchSection').find("input[name='searchQuery']").val()}/${$('#searchSection').find("input[name='isolation']").val()}`,
        type: 'GET',
        success: (rows) => {
            clearAlerts();
            $('#table').bootstrapTable('destroy').bootstrapTable({
                columns: [
                    [{
                      title: 'ID',
                      field: 'id',
                      rowspan: 2,
                      align: 'center',
                      valign: 'middle'
                    }, {
                      title: 'Movie Details',
                      colspan: 8,
                      align: 'center'
                    }],
                    [{
                      field: 'name',
                      title: 'Title',
                      align: 'center'
                    }, {
                      field: 'year',
                      title: 'Year',
                      align: 'center',
                    }, {
                      field: 'genre',
                      title: 'Genre',
                      align: 'center'
                    }, {
                      field: 'director',
                      title: 'Director',
                      align: 'center'
                    }, {
                      field: 'rank',
                      title: 'Rank',
                      align: 'center'
                    }, {
                      field: 'actor_1',
                      title: 'Actor 1',
                      align: 'center'
                    }, {
                      field: 'actor_2',
                      title: 'Actor 2',
                      align: 'center'
                    }, {
                      field: 'actor_3',
                      title: 'Actor 3',
                      align: 'center'
                    }]
                  ],
                  data: [...rows]
            });
        },
        error: (msg) => {
            clearAlerts();
            $('#searchAlert').text(msg);
        }
    });
});

function clearAlerts() {
    $('#deleteAlert').text('');
    $('#insertAlert').text('');
    $('#updateAlert').text('');
    $('#searchAlert').text('');
}