class AppAgeGate extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
    <div id="age-gate">
        <div class="age-box">
            <h2 class="premium-title" style="color:var(--dorado); margin-bottom: 5px; font-size:26px;">GRAN CATADOR</h2>
            <p style="font-size: 12px; margin-bottom: 20px; color: var(--texto-claro);">Ingresa tu fecha de nacimiento</p>
            <div class="dob-container">
                <input type="number" id="age-d" class="dob-input" placeholder="DD" min="1" max="31" aria-label="Día de nacimiento">
                <input type="number" id="age-m" class="dob-input" placeholder="MM" min="1" max="12" aria-label="Mes de nacimiento">
                <input type="number" id="age-y" class="dob-input" placeholder="AAAA" min="1900" max="2026" aria-label="Año de nacimiento">
            </div>
            <button onclick="verificarEdad()" class="age-btn">ENTRAR</button>
            <p id="age-error" class="age-error">Debes ser mayor de 18 años.</p>
        </div>
    </div>
        `;
    }
}
customElements.define('app-age-gate', AppAgeGate);
