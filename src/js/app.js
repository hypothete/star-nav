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
    color:0x021080,
    roughness: 0.2
  });
  var redMat = new THREE.MeshStandardMaterial({
    color:0xff0303,
    roughness: 0.8
  });

  //for testing
  var debugGeo = new THREE.SphereGeometry(0.01,8,8);
  var debugBall = new THREE.Mesh(debugGeo, redMat);

  //provides the minimap view
  var playerCam = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.001, 100 );
  var playerCamTarget = new THREE.Vector3(-0.004,0,0);

  //the globe
  var globeGeo = new THREE.SphereGeometry(1,128,128);
  var globeMesh = new THREE.Mesh(globeGeo, globeMat);

  var skyMat = new THREE.MeshBasicMaterial({
    side: THREE.BackSide
  });
  var skyMesh = new THREE.Mesh(globeGeo, skyMat);

  var maxWalkSpeed = 0.01;
  var maxTurnSpeed = 0.01;
  var walkSpeed = 0;
  var turnSpeed = 0;
  var friction = 0.13;
  var turndelta = 0.0001;
  var walkdelta = 0.00001;
  var charScale = 0.05;

  //DOM stuff
  var mousePosition = new THREE.Vector2(0,0);
  var mousedown = false;

  Promise.all([
    loadTexture('img/constellation_figures.jpg')
    ])
  .then(init);

  function init(agg){
    skyMat.map = agg[0];
    skyMat.needsUpdate = true;
    skyMesh.scale.set(5,5,5);
    scene.add(skyMesh);

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
    playerCam.position.set(-10*charScale,0,5*charScale);
    playerCam.lookAt(playerCamTarget);
    var globeLight = new THREE.SpotLight(0xfff0f0);
    scene.add(globeLight);
    globeLight.position.set(0,0,3);
    globeLight.angle = Math.PI/3;
    //globeLight.shadow.camera.fov = globeLight.angle*180/Math.PI;
    globeLight.target = playerObj;
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
    renderer.render(scene, playerCam);
  }

  function moveWithMouse(){
    if(mousedown){
      walkSpeed += -charScale*0.2*(mousePosition.y);
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