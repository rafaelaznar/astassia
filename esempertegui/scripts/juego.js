class Router {
    
    constructor() {
        this.renderPage()
    }
    
    renderPage(){
        const app = document.getElementById("app")
        app.innerHTML = this.renderJuego()
        iniciarJuego()
    }

    renderJuego() {
        return `
            <h2>Tres en Raya</h2>
            <div id="tablon" class="tablon"></div>
            <p id="status"></p>
            <button id="resetButton">Volver a jugar</button>
            <div id="fireworks-container" style="position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;"></div
        `
    }

}

function iniciarJuego(){
    
    let jugadorActual = "X";

    const tablon = document.getElementById("tablon")
    const status = document.getElementById("status")
    const resetButton = document.getElementById("resetButton")

    tablon.innerHTML = ""
    status.textContent = "Turno de " + jugadorActual

    let celdas = Array(9).fill(null)
    celdas.forEach((_, i) => {
        const celda = document.createElement("div")
        celda.classList.add("celda")
        celda.addEventListener("click", () => handleClick(i, celda))
        tablon.appendChild(celda)
    })

    const fireworksContainer = document.getElementById("fireworks-container");
    const handleClick = (i, celda) => {
        if(celdas[i] || checkWinner(celdas)){
            return ;
        }

        celdas[i] = jugadorActual;
        celda.textContent = jugadorActual;
        if(checkWinner(celdas)){
            status.textContent = "! Gana " + jugadorActual + " !";

            confetti({
                particleCount: 200,
                spread: 70,
                origin: { y: 0.6 }
            });

            const fireworks = new Fireworks.default(fireworksContainer, {
                autoresize: true,
                opacity: 0.5,
                acceleration: 1.05,
                friction: 0.97,
                gravity: 1.5,
                particles: 200,
                trace: 3,
                explosion: 5
            });
            fireworks.start();

            setTimeout(() => fireworks.stop(), 2500);

        } else if (celdas.every(Boolean)){
            status.textContent = "Empate !"
        } else {
            jugadorActual = jugadorActual === "X" ? "O" : "X";
            status.textContent = "Turno de " + jugadorActual
        }
    }

    resetButton.addEventListener("click", iniciarJuego)
}

// Función para analizar todas las posibles soluciones ganadoras
function checkWinner(celdas){

    const matrizComboWins = [
        [0,1,2],[3,4,5],[6,7,8],    // Filas wins
        [0,3,6],[1,4,7],[2,5,8],    // Columnas wins
        [0,4,8],[2,4,6]             // Diagonales wins
    ]

    return matrizComboWins.some(([a,b,c]) => celdas[a] && (celdas[a] === celdas[b]) && (celdas[a] === celdas[c])) // Devuelve true si hay una combinación ganadora, el jugador correspondite gana
}

document.addEventListener("DOMContentLoaded", () => new Router())