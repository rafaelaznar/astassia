$(document).ready(function() {
  // Cargar tareas desde localStorage o array vacío
  let tareas = JSON.parse(localStorage.getItem('tasks')) || [];

  // Guardar tareas en localStorage
  function saveTareas() {
    localStorage.setItem('tasks', JSON.stringify(tareas));
  }

  // Renderizar tareas según filtro
  function renderTareas(filtro = 'all') {
    const $tablon = $('#tablon');
    $tablon.empty();

    let tareasFiltradas = tareas.filter(task => {
      if (filtro === 'all') return true;
      if (filtro === 'pending') return !task.completed;
      if (filtro === 'completed') return task.completed;
    });

    tareasFiltradas.forEach(task => {
      const botones = (filtro === 'all') ? '' : `
        <button class="btn btn-sm btn-outline-success action-btn">
          ${task.completed ? '<i class="bi bi-arrow-counterclockwise"> Deshacer</i>' : '<i class="bi bi-check-circle"> Hecho</i>'}
        </button>
        <button class="btn btn-sm btn-outline-danger delete-btn"><i class="bi bi-trash"> Eliminar</i></button>
      `;

      const li = $(`
        <div class="list-group mb-2 d-flex flex-row justify-content-between align-items-center p-2 border rounded ${task.completed ? 'completed' : ''}" data-id="${task.id}">
          <span class="task-text">${task.text}</span>
          <div>
            ${botones}
          </div>
        </div>
      `);

      // Botón hecho / rehacer
      li.find('.action-btn').on('click', function() {
        task.completed = !task.completed;
        saveTareas();
        renderTareas(filtro); // Re-renderizar con el mismo filtro
      });

      // Botón eliminar
      li.find('.delete-btn').on('click', function() {
        tareas = tareas.filter(t => t.id !== task.id);
        saveTareas();
        renderTareas(filtro);
      });

      // Tachado solo si es completada y se está viendo "Todas"
      if (filtro === 'all' && task.completed) {
        li.find('.task-text').css('text-decoration', 'line-through');
      }

      $tablon.append(li);
    });
  }

  // Agregar tarea nueva
  $('#addTask').on('click', function() {
    const text = $('#taskInput').val().trim();
    if (text === '') return;

    const id = Date.now(); // id único
    tareas.push({ id, text, completed: false });
    saveTareas();
    $('#taskInput').val('');
    renderTareas('all');
  });

  // Enter para agregar
  $('#taskInput').on('keypress', function(e) {
    if (e.which === 13) $('#addTask').click();
  });

  // Botones de filtro
  $('.filter-btn').on('click', function() {
    const filtro = $(this).data('filter');
    $('.filter-btn').removeClass('active');
    $(this).addClass('active');
    renderTareas(filtro);
  });

  // Render inicial
  renderTareas('all');
});
