$(document).ready(function() {
    const apiKey = '123'; // Tu clave API
    const teamId = '133725'; // ID del Valencia CF

    $.ajax({
        url: `https://www.thesportsdb.com/api/v1/json/${apiKey}/lookupteam.php?id=${teamId}`,
        method: 'GET',
        success: function(data) {
            const team = data.teams[0];

            $('#team-name').text(team.strTeam);
            $('#team-logo').attr('src', team.strTeamBadge);
            $('#team-description').text(team.strDescriptionES);
            $('#team-manager').text(team.strManager);
            $('#team-location').text(team.strStadiumLocation);
            $('#team-established').text(team.intFormedYear);
        },
        error: function() {
            alert('No se pudo obtener la información del equipo.');
        }
    });
});


