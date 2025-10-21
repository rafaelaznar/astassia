$(document).ready(function() {
  // Listas válidas
  const VISIONS = ['Anemo','Geo','Electro','Dendro','Cryo','Pyro','Hydro'];
  const WEAPONS = ['Sword','Bow','Claymore','Polearm','Catalyst'];

  // Lista local de usuarios mostrados
  let usuarios = [];

  // Reemplazar append directo por función que renderiza la lista desde 'usuarios'
  function renderList() {
    const $lista = $('#listaUsuarios');
    $lista.empty();
    usuarios.forEach(u => {
      $lista.append(`<li>${u.name} - ${u.vision} - ${u.weapon}</li>`);
    });
  }

  // Validar formulario
  $('#registroForm').on('submit', function(e) {
    e.preventDefault();

    let nombre = $('#nombre').val().trim();
    let vision = $('#vision').val().trim();
    let weapon = $('#weapon').val().trim();
    let errores = [];

    // Nombre: longitud entre 3 y 100
    if (!nombre || nombre.length < 3 || nombre.length > 100) {
      errores.push("El nombre debe tener entre 3 y 100 caracteres.");
    }

    // Vision debe ser una de las permitidas (case-insensitive)
    const visionMatch = VISIONS.find(v => v.toLowerCase() === vision.toLowerCase());
    if (!vision || !visionMatch) {
      errores.push("Vision inválida. Opciones: " + VISIONS.join(', ') + ".");
    } else {
      vision = visionMatch; // normalizar formato
    }

    // Weapon debe ser una de las permitidas (case-insensitive)
    const weaponMatch = WEAPONS.find(w => w.toLowerCase() === weapon.toLowerCase());
    if (!weapon || !weaponMatch) {
      errores.push("Arma inválida. Opciones: " + WEAPONS.join(', ') + ".");
    } else {
      weapon = weaponMatch; // normalizar formato
    }

    if (errores.length > 0) {
      $('#mensaje').text(errores.join(' ')).css('color', 'red');
      return;
    }

    // Registro exitoso: añadir a la lista mostrada por la "API"
    $('#mensaje').text("¡Registro exitoso!").css('color', 'green');

    const nuevoUsuario = {
      name: nombre,
      vision: vision,
      weapon: weapon
    };

    // Añadir al array y re-renderizar
    usuarios.push(nuevoUsuario);
    renderList();

    // Limpiar formulario
    $('#nombre').val('');
    $('#vision').val('');
    $('#weapon').val('');
  });

  // Función para traer usuarios de una API
  function cargarUsuarios() {
    $.get('https://genshin.jmp.blue/characters/all', function(data) {
      // data es un array → lo iteramos y lo guardamos en usuarios
      usuarios = []; // reset por si
      data.forEach(usuario => {
        usuarios.push({
          name: usuario.name,
          vision: usuario.vision,
          weapon: usuario.weapon
        });
      });
      renderList();
    }).fail(function() {
      // en caso de error, mantener lista vacía o dejar nota
      console.warn('No se pudieron cargar usuarios desde la API.');
    });
  }

  // Ordenar cuando se pulse el botón
  $('#sortBtn').on('click', function() {
    const field = $('#sortField').val();
    usuarios.sort((a,b) => {
      const va = (a[field] || '').toString().toLowerCase();
      const vb = (b[field] || '').toString().toLowerCase();
      if (va < vb) return -1;
      if (va > vb) return 1;
      return 0;
    });
    renderList();
  });

  cargarUsuarios();
});
