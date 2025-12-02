// Script de debug para probar logout
// Ejecutar en la consola del navegador

console.log('=== DEBUG LOGOUT SCRIPT ===');

// Verificar si el contexto de autenticación está disponible
if (window.AuthContext) {
  console.log('✅ AuthContext disponible');
  console.log('Usuario actual:', window.AuthContext.user);
  console.log('Estado autenticado:', window.AuthContext.isAuthenticated);
} else {
  console.log('❌ AuthContext no disponible en window');
}

// Función para probar logout manualmente
window.testLogout = async () => {
  console.log('🔄 Iniciando test de logout...');

  try {
    // Simular el proceso de logout
    if (window.AuthContext && window.AuthContext.logout) {
      await window.AuthContext.logout();
      console.log('✅ Logout ejecutado');
    } else {
      console.log('❌ Función logout no disponible');
    }
  } catch (error) {
    console.error('❌ Error en test logout:', error);
  }
};

console.log('Para probar logout manualmente, ejecuta: testLogout()');
console.log('=== FIN DEBUG SCRIPT ===');
