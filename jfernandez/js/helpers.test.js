/**
 * Test para helpers.validarTitulo
 */
require('./helpers.js'); // esto añadirá window.SR.helpers

describe('helpers.validarTitulo', () => {
  test('acepta títulos válidos', () => {
    const fn = window.SR && window.SR.helpers && window.SR.helpers.validarTitulo;
    expect(typeof fn).toBe('function');
    expect(fn('The Matrix')).toBe(true);
    expect(fn('Spider-Man: No Way Home')).toBe(true);
    expect(fn('Se7en')).toBe(true);
  });

  test('rechaza títulos inválidos', () => {
    const fn = window.SR && window.SR.helpers && window.SR.helpers.validarTitulo;
    expect(fn('@#$%^&*')).toBe(false);
    expect(fn('')).toBe(false);
    // cadena demasiado larga
    const long = 'a'.repeat(200);
    expect(fn(long)).toBe(false);
  });
});
