// Funcionalidad principal de la aplicación
document.addEventListener('DOMContentLoaded', () => {
  // Referencias a elementos del DOM
  const minDistanceInput = document.getElementById('min-distance');
  const maxDistanceInput = document.getElementById('max-distance');
  const minDistanceValue = document.getElementById('min-distance-value');
  const maxDistanceValue = document.getElementById('max-distance-value');
  const applyFilterBtn = document.getElementById('apply-filter');
  const routesContainer = document.getElementById('routes-container');
  const routeDetail = document.getElementById('route-detail');
  const routeDetailContent = document.getElementById('route-detail-content');
  const backButton = document.getElementById('back-button');
  const gpsInfo = document.getElementById('gps-info');
  const gpsStatus = document.getElementById('gps-status');
  const timeRemaining = document.getElementById('time-remaining');
  const timeValue = document.getElementById('time-value');

  // Variables globales
  let filteredRoutes = [...routes];
  let selectedRoute = null;
  let userPosition = null;
  let watchId = null;

  // Actualizar valores de los sliders
  minDistanceInput.addEventListener('input', () => {
    minDistanceValue.textContent = `${minDistanceInput.value} km`;
    // Asegurar que min no sea mayor que max
    if (parseFloat(minDistanceInput.value) > parseFloat(maxDistanceInput.value)) {
      maxDistanceInput.value = minDistanceInput.value;
      maxDistanceValue.textContent = `${maxDistanceInput.value} km`;
    }
  });

  maxDistanceInput.addEventListener('input', () => {
    maxDistanceValue.textContent = `${maxDistanceInput.value} km`;
    // Asegurar que max no sea menor que min
    if (parseFloat(maxDistanceInput.value) < parseFloat(minDistanceInput.value)) {
      minDistanceInput.value = maxDistanceInput.value;
      minDistanceValue.textContent = `${minDistanceInput.value} km`;
    }
  });

  // Aplicar filtro de distancia
  applyFilterBtn.addEventListener('click', () => {
    const minDistance = parseFloat(minDistanceInput.value);
    const maxDistance = parseFloat(maxDistanceInput.value);
    
    filteredRoutes = routes.filter(route => 
      route.distancia >= minDistance && route.distancia <= maxDistance
    );
    
    // Ordenar rutas por distancia
    filteredRoutes.sort((a, b) => a.distancia - b.distancia);
    
    renderRoutes();
  });

  // Volver a la lista de rutas
  backButton.addEventListener('click', () => {
    routeDetail.classList.add('hidden');
    routesContainer.parentElement.classList.remove('hidden');
    
    // Detener el seguimiento GPS si está activo
    if (watchId) {
      navigator.geolocation.clearWatch(watchId);
      watchId = null;
    }
  });

  // Renderizar las tarjetas de rutas
  function renderRoutes() {
    routesContainer.innerHTML = '';
    
    if (filteredRoutes.length === 0) {
      routesContainer.innerHTML = '<p class="no-routes">No se encontraron rutas que coincidan con los criterios de filtrado.</p>';
      return;
    }
    
    filteredRoutes.forEach(route => {
      const routeCard = document.createElement('div');
      routeCard.className = 'route-card';
      routeCard.dataset.id = route.id;
      
      routeCard.innerHTML = `
        <div class="route-info">
          <h4 class="route-title">${route.nombre}</h4>
          <div class="route-stats">
            <div class="route-stat">
              <i class="fas fa-route"></i>
              <span>${route.distancia} km</span>
            </div>
            <div class="route-stat">
              <i class="fas fa-mountain"></i>
              <span>${route.dificultad}</span>
            </div>
            <div class="route-stat">
              <i class="fas fa-clock"></i>
              <span>${route.tiempo}</span>
            </div>
          </div>
          <p class="route-description">${route.descripcion}</p>
        </div>
      `;
      
      routeCard.addEventListener('click', () => showRouteDetail(route));
      routesContainer.appendChild(routeCard);
    });
  }

  // Mostrar detalle de ruta
  function showRouteDetail(route) {
    selectedRoute = route;
    
    routeDetailContent.innerHTML = `
      <div class="route-detail-header">
        <h3>${route.nombre}</h3>
        <p>${route.descripcion}</p>
      </div>
      
      <div class="route-detail-stats">
        <div class="route-detail-stat">
          <div class="stat-value">${route.distancia} km</div>
          <div class="stat-label">Distancia</div>
        </div>
        <div class="route-detail-stat">
          <div class="stat-value">${route.dificultad}</div>
          <div class="stat-label">Dificultad</div>
        </div>
        <div class="route-detail-stat">
          <div class="stat-value">${route.tiempo}</div>
          <div class="stat-label">Tiempo estimado</div>
        </div>
        <div class="route-detail-stat">
          <div class="stat-value">${route.desnivel_positivo} m</div>
          <div class="stat-label">Desnivel positivo</div>
        </div>
        <div class="route-detail-stat">
          <div class="stat-value">${route.tipo}</div>
          <div class="stat-label">Tipo de ruta</div>
        </div>
      </div>
      
      <div class="route-profile">
        <h4>Perfil de la ruta</h4>
        <p>${route.perfil}</p>
      </div>
    `;
    
    routesContainer.parentElement.classList.add('hidden');
    routeDetail.classList.remove('hidden');
    
    // Iniciar seguimiento GPS
    startGPSTracking();
  }

  // Iniciar seguimiento GPS
  function startGPSTracking() {
    if (!navigator.geolocation) {
      gpsStatus.textContent = 'La geolocalización no está disponible en este dispositivo.';
      return;
    }
    
    gpsStatus.textContent = 'Obteniendo ubicación...';
    
    watchId = navigator.geolocation.watchPosition(
      position => {
        userPosition = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        
        gpsStatus.textContent = 'Ubicación obtenida correctamente.';
        timeRemaining.classList.remove('hidden');
        
        // Calcular tiempo restante basado en la velocidad promedio de caminata
        calculateTimeRemaining();
      },
      error => {
        switch(error.code) {
          case error.PERMISSION_DENIED:
            gpsStatus.textContent = 'Permiso de geolocalización denegado.';
            break;
          case error.POSITION_UNAVAILABLE:
            gpsStatus.textContent = 'Información de ubicación no disponible.';
            break;
          case error.TIMEOUT:
            gpsStatus.textContent = 'Tiempo de espera agotado para obtener la ubicación.';
            break;
          default:
            gpsStatus.textContent = 'Error desconocido al obtener la ubicación.';
            break;
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  }

  // Calcular tiempo restante
  function calculateTimeRemaining() {
    if (!userPosition || !selectedRoute) return;
    
    // Velocidad promedio de caminata en km/h según dificultad
    let walkingSpeed;
    switch(selectedRoute.dificultad.toLowerCase()) {
      case 'fácil':
      case 'facil':
        walkingSpeed = 4.5; // Más rápido en rutas fáciles
        break;
      case 'moderado':
        walkingSpeed = 3.5; // Velocidad media en rutas moderadas
        break;
      case 'difícil':
      case 'dificil':
        walkingSpeed = 2.5; // Más lento en rutas difíciles
        break;
      default:
        walkingSpeed = 4; // Velocidad por defecto
    }
    
    // Ajustar velocidad según desnivel
    const desnivelPorKm = selectedRoute.desnivel_positivo / selectedRoute.distancia;
    if (desnivelPorKm > 100) {
      walkingSpeed *= 0.8; // Reducir velocidad en rutas con mucho desnivel
    }
    
    // Tiempo total en minutos
    let totalTimeMinutes;
    if (selectedRoute.tiempo && selectedRoute.tiempo.includes('horas')) {
      const timeMatch = selectedRoute.tiempo.match(/(\d+)\s+horas\s+(\d+)\s+minutos/);
      if (timeMatch) {
        totalTimeMinutes = parseInt(timeMatch[1]) * 60 + parseInt(timeMatch[2]);
      } else {
        totalTimeMinutes = selectedRoute.distancia / walkingSpeed * 60;
      }
    } else if (selectedRoute.tiempo && selectedRoute.tiempo.includes('hora')) {
      const timeMatch = selectedRoute.tiempo.match(/(\d+)\s+hora\s+(\d+)\s+minutos/);
      if (timeMatch) {
        totalTimeMinutes = parseInt(timeMatch[1]) * 60 + parseInt(timeMatch[2]);
      } else {
        totalTimeMinutes = selectedRoute.distancia / walkingSpeed * 60;
      }
    } else {
      totalTimeMinutes = selectedRoute.distancia / walkingSpeed * 60;
    }
    
    // Simulación de progreso en la ruta basado en la posición GPS
    // En una implementación real, calcularíamos la distancia exacta recorrida
    // usando las coordenadas GPS y comparando con el track de la ruta
    
    // Para esta simulación, usamos la hora del día para simular el progreso
    const now = new Date();
    const hourOfDay = now.getHours() + now.getMinutes() / 60;
    
    // Simular progreso basado en la hora (entre 0 y 1)
    const percentageCompleted = Math.min(0.95, Math.max(0.05, 
      (hourOfDay % 12) / 12)); // Varía entre 5% y 95% según la hora
    
    // Calcular tiempo restante
    const remainingTimeMinutes = totalTimeMinutes * (1 - percentageCompleted);
    
    const hours = Math.floor(remainingTimeMinutes / 60);
    const minutes = Math.floor(remainingTimeMinutes % 60);
    
    // Actualizar interfaz
    timeValue.textContent = hours > 0 
      ? `${hours} h ${minutes} min` 
      : `${minutes} minutos`;
    
    // Mostrar información adicional sobre el progreso
    const progressInfo = document.createElement('div');
    progressInfo.className = 'progress-info';
    progressInfo.innerHTML = `
      <div class="progress-bar">
        <div class="progress-fill" style="width: ${Math.round(percentageCompleted * 100)}%"></div>
      </div>
      <div class="progress-text">Progreso: ${Math.round(percentageCompleted * 100)}%</div>
      <div class="speed-info">Velocidad estimada: ${walkingSpeed.toFixed(1)} km/h</div>
    `;
    
    // Reemplazar o añadir la información de progreso
    const existingProgressInfo = document.querySelector('.progress-info');
    if (existingProgressInfo) {
      existingProgressInfo.replaceWith(progressInfo);
    } else {
      timeRemaining.appendChild(progressInfo);
    }
    
    // Actualizar cada minuto
    setTimeout(calculateTimeRemaining, 60000);
  }

  // Inicialización
  renderRoutes();
});
