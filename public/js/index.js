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
    $.ajax({
        url: '/createMovie',
        type: 'POST',
        data: {
            name: $('#insertSection').find("input[name='name']").val(),
            year: $('#insertSection').find("input[name='year']").val(),
            genre: $('#insertSection').find("input[name='genre']").val(),
            director: $('#insertSection').find("input[name='director']").val(),
            actor_1: $('#insertSection').find("input[name='actor_1']").val(),
            actor_2: $('#insertSection').find("input[name='actor_2']").val(),
            id: $('#insertSection').find("input[name='id']").val(),
            isolation: $('#insertSection').find("input[name='isolation']").val()
        },
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
    $.ajax({
        url: '/updateMovie',
        type: 'POST',
        data: {
            name: $('#updateSection').find("input[name='name']").val(),
            // year: $('#updateSection').find("input[name='year']").val(),
            genre: $('#updateSection').find("input[name='genre']").val(),
            director: $('#updateSection').find("input[name='director']").val(),
            actor_1: $('#updateSection').find("input[name='actor_1']").val(),
            actor_2: $('#updateSection').find("input[name='actor_2']").val(),
            id: $('#updateSection').find("input[name='id']").val(),
            isolation: $('#updateSection').find("input[name='isolation']").val()
        },
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

function clearAlerts() {
    $('#deleteAlert').text('');
    $('#insertAlert').text('');
    $('#updateAlert').text('');
}