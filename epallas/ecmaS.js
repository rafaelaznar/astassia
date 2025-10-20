document.addEventListener('DOMContentLoaded', function() {
    const yearSelect = document.getElementById('yearSelect');
    const buscarBtn = document.getElementById('buscarBtn');
    const resultadosDiv = document.getElementById('resultados');

    // Relleno el select con años desde 2000 hasta el año actual
    const currentYear = new Date().getFullYear();
    for (let year = 1950; year <= currentYear; year++) {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        yearSelect.appendChild(option);
    }

    //Clic en el botón Buscar
    buscarBtn.addEventListener('click', async () => {
        const selectedYear = yearSelect.value;
        resultadosDiv.innerHTML = `<p>Cargando datos para el año ${selectedYear}...</p>`;

    try{
        //Llamada a la api
            const response = await fetch(`https://api.jolpi.ca/ergast/f1/${selectedYear}/results.json`);
            const data = await response.json();
            const races = data.MRData.RaceTable.Races;

            if (!races | races.length === 0) {
                resultadosDiv.innerHTML = `<p>No se encontraron datos para el año ${selectedYear}.</p>`;
                return;
            }

            // Construimos la tabla con las carreras
            let tablaHTML = `
             <div class="table-responsive mt-4">
            <table class="table table-striped table-dark table-hover align-middle">
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
    const winner = race.Results[0].Driver;
    const constructor = race.Results[0].Constructor;
    tablaHTML += `
      <tr>
        <td>${index + 1}</td>
        <td>${race.raceName}</td>
        <td>${race.Circuit.circuitName}</td>
        <td>${race.date}</td>
        <td>${winner.givenName} ${winner.familyName}</td>
        <td>${constructor.name}</td>
      </tr>
    `;
    
  });
   tablaHTML += `</tbody></table></div>`;
      resultadosDiv.innerHTML = tablaHTML;
    }
    catch(error){
        resultadosDiv.innerHTML = `<p>Error al obtener los datos: ${error.message}</p>`;
        return;
    }
}
);


});
