(() => {
    'use strict';

    const forms = document.querySelectorAll('.needs-validation'); // si hubieran más fomularios pillará todos los formularios con la clase .needs-validation

    Array.from(forms).forEach(form => {
        form.addEventListener('submit', event => {
            if (!form.checkValidity()) {
                event.preventDefault();
                event.stopPropagation();
            }
            form.classList.add('was-validated');
        }, false);
    });

    const inputCiudad = document.getElementById('inputCiudad');
    const selectProvincia = document.getElementById('selectProvincia');
    const API_KEY = 'b3bc8b8877708c3bc01cf777aa7f741069c52e0a6b1b93f105ab5a5e0acea5bc';
    let debounceTimer = null;

    // Evento al escribir en el campo de ciudad
    inputCiudad.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        const nombreCiudad = inputCiudad.value.trim();

        if (nombreCiudad.length < 2) {
            selectProvincia.innerHTML = `<option selected disabled value="">Elige...</option>`;
            return;
        }

        debounceTimer = setTimeout(() => buscarProvinciasPorCiudad(nombreCiudad), 600);
    });

    // Función principal
    async function buscarProvinciasPorCiudad(nombreCiudad) {

        const municipiosURL = `https://apiv1.geoapi.es/municipios?QUERY=${encodeURIComponent(nombreCiudad)}&type=JSON&version=2021.01&key=${API_KEY}`;
        selectProvincia.innerHTML = `<option disabled selected value="">Cargando...</option>`;

        try {
            const respMunicipios = await fetch(municipiosURL);
            if (!respMunicipios.ok) throw new Error('Error en la API de municipios');
            const municipiosData = await respMunicipios.json();

            // Extraemos los códigos de provincia únicos (CPRO)
            const codigosCPRO = [...new Set(municipiosData.data.map(m => m.CPRO))];

            if (codigosCPRO.length === 0) {
                selectProvincia.innerHTML = `<option disabled selected value="">No encontrada</option>`;
                return;
            }

            // Peticiones paralelas a la API de provincias por cada CPRO
            const provinciasPromises = codigosCPRO.map(cpro =>
            fetch(`https://apiv1.geoapi.es/provincias?CPRO=${cpro}&type=JSON&version=2021.01&key=${API_KEY}`)
                .then(r => r.ok ? r.json() : null)
                .catch(() => null)
            );

            const provinciasResponses = await Promise.all(provinciasPromises);

            // Extraemos nombres de provincias válidos
            const provincias = provinciasResponses
                                    .filter(res => res && res.data && res.data.length > 0)
                                    .map(res => res.data[0].PRO)
                                    .filter((v, i, arr) => v && arr.indexOf(v) === i); // únicas

            selectProvincia.innerHTML = `<option selected disabled value="">Elige provincia...</option>`;

            if (provincias.length > 0) {
                provincias.forEach(nombreProv => {
                    const option = document.createElement('option');
                    option.value = nombreProv;
                    option.textContent = nombreProv;
                    selectProvincia.appendChild(option);
                });
            } else {
                selectProvincia.innerHTML = `<option disabled selected value="">No encontrada</option>`;
            }

        } catch (err) {
            console.error(err);
            selectProvincia.innerHTML = `<option disabled selected value="">Error al conectar</option>`;
        }
    }
    
    //Evento y lógica para RELLENAR los datos de ciudad y provincia con el CP
    const inputCP = document.getElementById('inputCP');
    const cpDebounceDelay = 400;
    let cpDebounceTimer = null;

    // función para procesar CP
    async function procesarCP(cp) {
        if (!/^\d{5}$/.test(cp)) {
            // si no es 5 dígitos, no hacemos nada
            console.log('CP no válido (debe tener 5 dígitos):', cp);
            return;
        }

        selectProvincia.innerHTML = `<option selected disabled value="">Buscando...</option>`;

        try {
            // 1.- Consultar vía para obtener DMUN50 y CPRO
            const viasURL = `https://apiv1.geoapi.es/vias?CPOS=${encodeURIComponent(cp)}&type=JSON&version=2025.07&key=${API_KEY}`;
            console.log('Consultando VÍAS:', viasURL);
            const respVias = await fetch(viasURL);
            if (!respVias.ok) throw new Error('Error al consultar la API de vías');

            const viasData = await respVias.json();

            if (!viasData.data || viasData.data.length === 0) {
                selectProvincia.innerHTML = `<option disabled selected value="">No encontrada</option>`;
                console.warn('Sin resultados en VÍAS para CP:', cp);
                return;
            }

            // Tomamos el primer resultado disponible
            const via = viasData.data[0];
            const codigoProvincia = via.CPRO;
            const ciudad = via.DMUN50 || '';

            // Rellenar la ciudad
            inputCiudad.value = ciudad;
            console.log('Ciudad encontrada:', ciudad, 'CPRO:', codigoProvincia);

            // 2.- Obtener la provincia por CPRO (usar versión 2025.07 para coherencia)
            const provinciaURL = `https://apiv1.geoapi.es/provincias?CPRO=${encodeURIComponent(codigoProvincia)}&type=JSON&version=2025.07&key=${API_KEY}`;
            console.log('Consultando PROVINCIA:', provinciaURL);
            const respProvincia = await fetch(provinciaURL);
            if (!respProvincia.ok) throw new Error('Error al obtener provincia');

            const provinciaData = await respProvincia.json();
            const provinciaNombre = provinciaData.data?.[0]?.PRO?.trim() || 'Desconocida';

            // Actualizar el select:
            // - si ya existe una opción con mismo texto, seleccionarla
            // - si no, crearla y seleccionarla
            let found = false;
            for (let i = 0; i < selectProvincia.options.length; i++) {
                const opt = selectProvincia.options[i];
                if (opt.value === provinciaNombre || opt.text === provinciaNombre) {
                    opt.selected = true;
                    found = true;
                    break;
                }
            }

            if (!found) {
                selectProvincia.innerHTML = ''; // Limpiar y añadir la provincia encontrada.
                const option = document.createElement('option');
                option.value = provinciaNombre;
                option.textContent = provinciaNombre;
                option.selected = true;
                selectProvincia.appendChild(option);
            }
        } catch (error) {
            console.error(error);
            selectProvincia.innerHTML = `<option disabled selected value="">Error al conectar</option>`;
        }
    }

    // Escuchar 'input' con debounce para reaccionar al tecleo sin necesidad de salir del campo.
    inputCP.addEventListener('input', () => {
        clearTimeout(cpDebounceTimer);
        const cp = inputCP.value.trim();
        cpDebounceTimer = setTimeout(() => procesarCP(cp), cpDebounceDelay);
    });

    // También en 'blur' por si pegan el CP y no siguen escribiendo.
    inputCP.addEventListener('blur', () => {
        clearTimeout(cpDebounceTimer);
        procesarCP(inputCP.value.trim());
    });

    //Si el formulario se resetea, limpiar el select.
    const form = document.querySelector('form');

    if (form) {
        form.addEventListener('reset', () => {
            selectProvincia.innerHTML = `<option selected disabled value="">Elige...</option>`;
        });
    }
})();