(function(THREE, Promise, console){
  'use strict';

  var renderer = new THREE.WebGLRenderer();
  var scene = new THREE.Scene();
  var texLoad = new THREE.TextureLoader();

  //the orbiting camera over the globe
  var globeCamAltitude = 1.0001; // in planet radii
  var playerObjPivot = new THREE.Object3D();
  var playerObj = new THREE.Object3D();

  //direction indicator on minimap
  var centerToCam = new THREE.Vector3(0, 0, -1);
  var centerToAxis = new THREE.Vector3(0,1,0);

  var globeMat = new THREE.MeshStandardMaterial({
    metalness: 0
  });
  var redMat = new THREE.MeshStandardMaterial({
    color:0xff0303,
    roughness: 0.8,
    metalness: 1
  });

  //for testing
  var debugGeo = new THREE.SphereGeometry(0.001,8,8);
  var debugBall = new THREE.Mesh(debugGeo, redMat);

  //provides the minimap view
  var playerCam = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.001, 100 );
  var playerCamTarget = new THREE.Vector3(2,0,0);

  //the globe
  var globeGeo = new THREE.SphereGeometry(1,128,128);
  var globeMesh = new THREE.Mesh(globeGeo, globeMat);

  //the sky and sky light
  var skyMat = new THREE.MeshBasicMaterial({
    side: THREE.BackSide
  });
  var skyMesh = new THREE.Mesh(globeGeo, skyMat);
  var skyAmbient = new THREE.AmbientLight(0x404060);
  var sunPivot = new THREE.Object3D();
  var sunLight = new THREE.DirectionalLight(0xfff0f0);
  var sunspeed = 0.01;

  var maxWalkSpeed = 0.1;
  var maxTurnSpeed = 0.008;
  var walkSpeed = 0;
  var turnSpeed = 0;
  var friction = 0.13;
  var turndelta = 0.0001;
  var walkdelta = 0.00001;
  var charScale = 0.001;

  //DOM stuff
  var mousePosition = new THREE.Vector2(0,0);
  var mousedown = false;

  Promise.all([
    loadTexture('img/constellation_figures.jpg'),
    loadTexture('img/earth-map.jpg'),
    loadTexture('img/earth-rough-map.jpg')
  ])
  .then(init);

  function init(agg){
    skyMat.map = agg[0];
    skyMat.needsUpdate = true;
    skyMesh.scale.set(2,2,2);

    globeMat.map = agg[1];
    globeMat.roughnessMap = agg[2];
    globeMat.needsUpdate = true;

    //renderer setup
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    //globe scene setup
    scene.add(globeMesh, playerObjPivot);
    playerObjPivot.add(playerObj);
    playerObj.position.set(0,0,-globeCamAltitude);
    playerObj.lookAt(globeMesh.position);
    playerObj.rotation.x+= Math.PI;
    playerObj.rotation.z += Math.PI;
    playerObj.add(playerCam, debugBall);
    playerCam.up.set(0,0,1);
    playerCam.position.set(-10*charScale,0,2*charScale);
    playerCam.lookAt(playerCamTarget);
    sunPivot.add(skyMesh,sunLight);
    sunLight.position.set(0,0,-1);
    scene.add(sunPivot, skyAmbient);
    //sunLight.angle = Math.PI/3;
    //sunLight.shadow.camera.fov = sunLight.angle*180/Math.PI;
    //sunLight.target = playerObj;
    renderAll();
  }

  function loadTexture(src){
    return new Promise(function(res){
      texLoad.load(src, res);
    });
  }

  function renderAll(){
    window.requestAnimationFrame(renderAll);
    moveWithMouse();
    sunPivot.rotation.y += sunspeed;
    renderer.render(scene, playerCam);
  }

  function moveWithMouse(){
    if(mousedown){
      walkSpeed += -charScale*(mousePosition.y);
      if(walkSpeed > maxWalkSpeed){
        walkSpeed = maxWalkSpeed;
      }
      turnSpeed = -0.1*mousePosition.x;
    }

    walkSpeed *= 1-friction;
    if(walkSpeed < walkdelta){
      walkSpeed = 0;
    }
    turnSpeed *= 1-friction;

    if(Math.abs(turnSpeed) < turndelta){
      turnSpeed = 0;
    }
    else if(Math.abs(turnSpeed) > maxTurnSpeed){
      turnSpeed = Math.sign(turnSpeed) * maxTurnSpeed;
    }

    playerObjPivot.rotateOnAxis(centerToAxis, walkSpeed);
    playerObjPivot.rotateOnAxis(centerToCam, turnSpeed);
  }

  document.addEventListener('mousemove', function(evt){
    var newMP = new THREE.Vector2(
      evt.clientX / window.innerWidth - 0.5,
      evt.clientY / window.innerHeight - 0.5);

    mousePosition = mousePosition.copy(newMP);
  });

  document.addEventListener('mousedown', function(){
    mousedown = true;
  });

  document.addEventListener('mouseup', function(){
    mousedown = false;
  });

  document.addEventListener('mousewheel', function(evt){
    if(evt.wheelDelta > 0){
      playerCam.position.multiplyScalar(0.9);
    }
    else if(evt.wheelDelta < 0){
      playerCam.position.multiplyScalar(1.1);
    }
    //playerCam.lookAt(playerCamTarget);
  });

  window.addEventListener('resize', function(){
    renderer.setSize(window.innerWidth, window.innerHeight);
    playerCam.updateProjectionMatrix();
  });

})(window.THREE, window.Promise, window.console);
