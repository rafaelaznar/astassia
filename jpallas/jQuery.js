$(document).ready(function(){
  // Clave de la API
    const apiKey = 'live_jtJP2yGruhbdkTW8VRsbdxcy94hbYvqCF7zgFaTu7WumqqhtXzUnJvDvkbdV18vX'; 
  // Obtenemos la lista de razas
  $.ajax({
    url: 'https://api.thedogapi.com/v1/breeds',
    method: 'GET',
    headers: { 'x-api-key': apiKey }
  }).done(razas => {
    // Limpio el contenedor antes de agregar contenido
    $('#dogs').html('');
    
    // Muestro 14 razas de perros con su información
    razas.slice(0,14).forEach(raza=> {
      const imgUrl = raza.image?.url || 'https://via.placeholder.com/220x150?text=No+Image';
      const card = `
        <div class="col-sm-12 col-md-6 col-lg-4 mb-4">
            <div class="card h-100 shadow-sm hover-scale">
          <img src="${imgUrl}" alt="${raza.name}" class="card-img-top">
            <div class="card-body">
          <h3 class="card-title">${raza.name}</h3>
          <div class="card-text">
          <p><strong>Temperamento:</strong> ${raza.temperament || 'Desconocido'}</p>
          <p><strong>Peso:</strong> ${raza.weight.metric} kg</p>
          <p><strong>Altura:</strong> ${raza.height.metric} cm</p>
          <p><strong>Esperanza de vida:</strong> ${raza.life_span}</p>
          </div>
          </div>
          </div>
        </div>
      `;
      $('#dogs').append(card);
    });
  }).fail(function(err){
    console.error('Error API The Dog API', err);
    $('#dogs').html('<p>Error cargando datos de la API.</p>');
  });
});