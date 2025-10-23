$(document).ready(function(){
  const apiKey = 'live_jtJP2yGruhbdkTW8VRsbdxcy94hbYvqCF7zgFaTu7WumqqhtXzUnJvDvkbdV18vX';
  let breeds = [];

  // Util: debounce
  function debounce(fn, wait){
    let t;
    return function(...args){
      clearTimeout(t);
      t = setTimeout(()=> fn.apply(this,args), wait);
    }
  }

  // Renderizar tarjetas (lista de razas)
  function renderCards(list, query){
    const $container = $('#dogs');
    $container.empty();
    query = (query||'').trim().toLowerCase();

    if(!list.length){
      $('#count').text(0);
      $container.append(`<div class="col-12 text-center muted">No se encontraron razas.<br/><small>Prueba con otra búsqueda.</small></div>`);
      return;
    }

    $('#count').text(list.length);
    list.forEach(raza => {
      const imgUrl = (raza.image && raza.image.url) || 'https://via.placeholder.com/440x300?text=No+Image';
      let nameHtml = raza.name;
      if(query){
        const idx = raza.name.toLowerCase().indexOf(query);
        if(idx !== -1){
          const before = raza.name.slice(0, idx);
          const match = raza.name.slice(idx, idx + query.length);
          const after = raza.name.slice(idx + query.length);
          nameHtml = `${before}<span class="highlight">${match}</span>${after}`;
        }
      }

      const weight = raza.weight?.metric || '—';
      const height = raza.height?.metric || '—';
      const life = raza.life_span || '—';

      const card = `
        <div class="col-sm-12 col-md-6 col-lg-4">
          <div class="card card-dog h-100 hover-scale" data-id="${raza.id}" role="button">
            <img src="${imgUrl}" alt="${raza.name}" class="card-img-top">
            <div class="card-body">
              <h5 class="card-title mb-1">${nameHtml}</h5>
              <p class="muted mb-1"><strong>Temperamento:</strong> ${raza.temperament || 'Desconocido'}</p>
              <p class="muted mb-0"><small><strong>Peso:</strong> ${weight} kg • <strong>Altura:</strong> ${height} cm</small></p>
              <div class="mt-2"><small class="text-muted">Esperanza vida: ${life}</small></div>
            </div>
          </div>
        </div>
      `;
      $container.append(card);
    });
  }

  // Mostrar modal con detalles completos
  function showDetailModal(id){
    const raza = breeds.find(b => b.id == id);
    if(!raza) return;
    const imgUrl = (raza.image && raza.image.url) || 'https://via.placeholder.com/640x420?text=No+Image';

    const modalHtml = `
      <div class="container-fluid">
        <div class="row">
          <div class="col-12 mb-2 text-center"><img src="${imgUrl}" alt="${raza.name}" class="img-fluid rounded"></div>
        </div>
        <div class="row">
          <div class="col-12">
            <h4>${raza.name}</h4>
            <p class="muted"><strong>Temperamento:</strong> ${raza.temperament || 'Desconocido'}</p>
            <p class="muted"><strong>Origen:</strong> ${raza.origin || '—'}</p>
            <p class="muted"><strong>Peso:</strong> ${raza.weight?.metric || '—'} kg</p>
            <p class="muted"><strong>Altura:</strong> ${raza.height?.metric || '—'} cm</p>
            <p class="muted"><strong>Esperanza de vida:</strong> ${raza.life_span || '—'}</p>
            <p class="muted"><strong>Historia:</strong> ${raza.history || raza.bred_for || 'No disponible'}</p>
          </div>
        </div>
      </div>
    `;

    const modalTitle = `${raza.name}`;
    const $modal = $(`
      <div class="modal fade" id="detailModal" tabindex="-1">
        <div class="modal-dialog modal-lg modal-dialog-centered">
          <div class="modal-content bg-dark text-white">
            <div class="modal-header border-0">
              <h5 class="modal-title">${modalTitle}</h5>
              <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">${modalHtml}</div>
            <div class="modal-footer border-0">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
            </div>
          </div>
        </div>
      </div>
    `);

    $('#detailModal').remove();
    $('body').append($modal);
    const bsModal = new bootstrap.Modal(document.getElementById('detailModal'));
    bsModal.show();
  }

  // Filtrar por término
  function filterBreeds(term){
    term = (term||'').trim().toLowerCase();
    if(!term) return breeds.slice(0, 20);
    return breeds.filter(b => {
      return (b.name && b.name.toLowerCase().includes(term)) ||
             (b.temperament && b.temperament.toLowerCase().includes(term));
    });
  }

  // Eventos UI
  $('#search').on('input', debounce(function(){
    const q = $(this).val();
    const results = filterBreeds(q);
    renderCards(results, q);
  }, 200));

  $('#clear').on('click', function(){
    $('#search').val('');
    renderCards(breeds.slice(0,20));
  });

  $('#openGuide').on('click', function(){
    const guideModal = new bootstrap.Modal(document.getElementById('guideModal'));
    guideModal.show();
  });

  $('#dogs').on('click', '.card-dog', function(){
    const id = $(this).data('id');
    showDetailModal(id);
  });

  //Cargar razas
  async function loadBreeds() {
    try {
      const data = await $.ajax({
        url: 'https://api.thedogapi.com/v1/breeds',
        method: 'GET',
        headers: { 'x-api-key': apiKey }
      });
      breeds = data || [];
      renderCards(breeds.slice(0, 20));
    } catch (err) {
      console.error('Error API The Dog API', err);
      $('#dogs').html('<div class="col-12 text-center text-danger">Error cargando datos de la API.</div>');
    }
  }

  // Llamar a la función asíncrona
  loadBreeds();
});
