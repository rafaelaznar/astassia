$(document).ready(function() {
  // Listas válidas (se usan para validaciones/normalización opcional)
  const VISIONS = ['Anemo','Geo','Electro','Dendro','Cryo','Pyro','Hydro'];
  const WEAPONS = ['Sword','Bow','Claymore','Polearm','Catalyst'];

  // Datos en memoria
  let usuarios = [];       // todos los personajes descargados desde la API
  let resultados = [];     // resultados filtrados actualmente mostrados

  // Helper: crear slug desde nombre para construir la URL de la imagen
  function toSlug(name) {
    return name.toString().toLowerCase()
      .normalize('NFKD').replace(/[\u0300-\u036f]/g, '') // eliminar acentos
      .replace(/[^a-z0-9\s-]/g, '') // quitar chars no alfanuméricos
      .trim()
      .replace(/\s+/g, '-');
  }

  function imageUrlFor(usuario) {
    // si la API incluye un campo 'slug' o 'id', usarlo; si no, derivar del name
    const base = 'https://genshin.jmp.blue/characters';
    const slug = (usuario.slug || usuario.id || usuario.name) ? toSlug(usuario.slug || usuario.id || usuario.name) : toSlug(usuario.name || '');
    return `${base}/${encodeURIComponent(slug)}/card`;
  }

  // Nueva función: construir URL de fandom para un personaje
  function fandomUrl(name) {
    if (!name) return '#';
    // Reemplazar espacios por guiones bajos y luego escapar
    const wikename = name.replace(/\s+/g, '_');
    return 'https://genshin-impact.fandom.com/es/wiki/' + encodeURIComponent(wikename);
  }

  function renderTable(list) {
    const $tbody = $('#resultsTable tbody');
    $tbody.empty();
    if (!list || list.length === 0) {
      $tbody.append('<tr><td colspan="4" style="text-align:center;">No hay resultados</td></tr>');
      return;
    }
    list.forEach(u => {
      const imgSrc = imageUrlFor(u);
      const wiki = fandomUrl(u.name);
      const img = `<a href="${wiki}" target="_blank" rel="noopener"><img src="${imgSrc}" alt="${u.name}" style="width:500px;height:800px;object-fit:cover;"></a>`;
      $tbody.append(`<tr>
        <td>${img}</td>
        <td>${u.name}</td>
        <td>${u.vision || ''}</td>
        <td>${u.weapon || ''}</td>
      </tr>`);
    });
  }

  // Buscar aplicando filtros (coincidencia parcial, case-insensitive)
  function doSearch() {
    const qName = $('#searchName').val().trim().toLowerCase();
    const qVision = $('#searchVision').val().trim().toLowerCase();
    const qWeapon = $('#searchWeapon').val().trim().toLowerCase();

    resultados = usuarios.filter(u => {
      const name = (u.name || '').toString().toLowerCase();
      const vision = (u.vision || '').toString().toLowerCase();
      const weapon = (u.weapon || '').toString().toLowerCase();

      if (qName && !name.includes(qName)) return false;
      if (qVision && !vision.includes(qVision)) return false;
      if (qWeapon && !weapon.includes(qWeapon)) return false;
      return true;
    });

    renderTable(resultados);
  }

  // Ordenar resultados mostrados por campo seleccionado
  function sortResults(field) {
    resultados.sort((a,b) => {
      const va = (a[field] || '').toString().toLowerCase();
      const vb = (b[field] || '').toString().toLowerCase();
      if (va < vb) return -1;
      if (va > vb) return 1;
      return 0;
    });
    renderTable(resultados);
  }

  // Limpiar filtros y mostrar todos
  function clearFilters() {
    $('#searchName').val('');
    $('#searchVision').val('');
    $('#searchWeapon').val('');
    resultados = usuarios.slice();
    renderTable(resultados);
  }

  // Cargar personajes desde la API al inicio
  function cargarUsuarios() {
    $.get('https://genshin.jmp.blue/characters/all', function(data) {
      usuarios = data.map(u => ({
        // normalizar estructura mínima
        name: u.name || '',
        vision: u.vision || '',
        weapon: u.weapon || '',
        slug: u.slug || u.id || undefined
      }));
      resultados = usuarios.slice();
      renderTable(resultados);
    }).fail(function() {
      $('#mensaje').text('No se pudieron cargar personajes desde la API.').css('color','red');
    });
  }

  // Eventos UI
  $('#searchForm').on('submit', function(e) {
    e.preventDefault();
    doSearch();
  });

  $('#clearBtn').on('click', function() {
    clearFilters();
    $('#mensaje').text('');
  });

  $('#sortBtn').on('click', function() {
    const field = $('#sortField').val();
    sortResults(field);
  });

  // Inicial
  cargarUsuarios();
});
