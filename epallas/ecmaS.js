document.addEventListener('DOMContentLoaded', () => {
    const yearSelect = document.getElementById('yearSelect');
    const buscarBtn = document.getElementById('buscarBtn');
    const resultadosDiv = document.getElementById('resultados');
    const borrarBtn = document.getElementById('borrarBtn');
    const formFavorita = document.getElementById('formFavorita');
    const favoritaInput = document.getElementById('favorita');
    const errorFavorita = document.getElementById('errorFavorita');
    const principalDiv = document.getElementById('principal');

    // Relleno el select con años desde 1950 hasta 2025
    for (let year = 1950; year <= 2025; year++) {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        yearSelect.appendChild(option);
    }

    // Envío del formulario de temporada favorita
    formFavorita.addEventListener('submit', (event) => {
        event.preventDefault(); // Evita que recargue la página

        const favoritaYear = favoritaInput.value.trim();
        const regex = /^(19[5-9]\d|20[0-1]\d|202[0-5])$/;

        if (!regex.test(favoritaYear)) {
            errorFavorita.textContent = 'Por favor, introduce un año válido entre 1950 y 2025.';
            return;
        }

        errorFavorita.textContent = '';
        yearSelect.value = favoritaYear;

        // Agregamos el mensaje al final del div principal sin InnerHTML para evitar romper otros elementos
        const mensaje = document.createElement('h2');
        mensaje.className = "text-center mb-4 text-success fw-bold";
        mensaje.textContent = "¡Gracias por tu opinión! ✅";
        principalDiv.appendChild(mensaje);
        favoritaInput.disabled = 'true';
        enviarBtn.disabled = 'true';

        // Limpiamos el input de temporada favorita
        favoritaInput.value = '';
    });

    // Clic en el botón Buscar
    buscarBtn.addEventListener('click', async () => {
        const selectedYear = yearSelect.value;
        resultadosDiv.innerHTML = `<p>Cargando datos para el año ${selectedYear}...</p>`;

        try {
            const response = await fetch(`https://api.jolpi.ca/ergast/f1/${selectedYear}/results.json`);
            const data = await response.json();
            const races = data.MRData.RaceTable.Races;

            if (!races || races.length === 0) {
                resultadosDiv.innerHTML = `<p>No se encontraron datos para el año ${selectedYear}.</p>`;
                return;
            }

            let tablaHTML = `
                <div class="table-responsive mt-4">
                    <table class="table table-striped table-dark table-hover align-middle rounded-4 shadow-sm">
                        <thead class="table-danger">
                            <tr>
                                <th>#</th>
                                <th>Carrera</th>
                                <th>Circuito</th>
                                <th>Fecha</th>
                                <th>Ganador</th>
                                <th>Equipo</th>
                            </tr>
                        </thead>
                        <tbody>
            `;

            races.forEach((race, index) => {
                const { givenName, familyName } = race.Results[0].Driver;
                const { name: constructorName } = race.Results[0].Constructor;
                tablaHTML += `
                    <tr>
                        <td>${index + 1}</td>
                        <td>${race.raceName}</td>
                        <td>${race.Circuit.circuitName}</td>
                        <td>${race.date}</td>
                        <td>${givenName} ${familyName}</td>
                        <td>${constructorName}</td>
                    </tr>
                `;
            });

            tablaHTML += `</tbody></table></div>`;
            resultadosDiv.innerHTML = tablaHTML;
            resultadosDiv.classList.add('fade-in');


        } catch (error) {
            resultadosDiv.innerHTML = `<p>Error al obtener los datos: ${error.message}</p>`;
        }
    });

    // Clic en el botón Borrar
    borrarBtn.addEventListener('click', () => {
        resultadosDiv.innerHTML = `<p class="text-center text-light">Selecciona un año para ver las 2 primeras carreras 🏁</p>`;
        yearSelect.value = '1950';
        favoritaInput.value = '';
        errorFavorita.textContent = '';
    });
});
