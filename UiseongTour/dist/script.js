//설정
const config = {
  type: Phaser.AUTO,
  width: "100%",
  height: "100%",
  parent: "game-container",
  pixelArt: true,
  physics: {
    default: "arcade",
    arcade: {
      //중력 : 멈춰있을떄 캐릭터가 향하는 방향
      //0: 이전 입력과 같은 방향
      gravity: { y: 0 } } 
    },


  scene: {
    preload: preload,
    create: create,
    update: update } 
  
  };





const game = new Phaser.Game(config);
let cursors;
let player;
let showDebug = false;

function preload() {
  //타일셋 이미지
  this.load.image("tiles", "https://mikewesthad.github.io/phaser-3-tilemap-blog-posts/post-1/assets/tilesets/tuxmon-sample-32px-extruded.png");
  //타일셋 위치 정하는 json 파일
  this.load.tilemapTiledJSON("map", "https://mikewesthad.github.io/phaser-3-tilemap-blog-posts/post-1/assets/tilemaps/tuxemon-town.json");

  // 아틀라스: 여러 이미지를 하나의 텍스처로 묶는 방법

  // 하나의 이미지에서 플레이어 애니메이션(왼쪽으로 걷기, 오른쪽으로 걷기 등).
  //      참조링크: https://labs.phaser.io/view.html?src=src/animation/texture%20atlas%20animation.js
  
  // 아틀라스를 사용하지 않는 경우 스프라이트시트로 동일한 작업을 수행 가능.
  //      참조링크:  https://labs.phaser.io/view.html?src=src/animation/single%20sprite%20sheet.js
  
  //캐릭터 아틀라스
  //원래 캐릭터: "https://mikewesthad.github.io/phaser-3-tilemap-blog-posts/post-1/assets/atlas/atlas.png"
  this.load.atlas("atlas", "../asset/player.png", "https://mikewesthad.github.io/phaser-3-tilemap-blog-posts/post-1/assets/atlas/atlas.json");
}

function create() {
  const map = this.make.tilemap({ key: "map" });

  // 매개변수는 Tiled에서 타일셋에 지정한 이름과 다음에서 타일셋 이미지의 키.
  // Phaser의 캐시(예: 사전 로드에서 사용한 이름)
  const tileset = map.addTilesetImage("tuxmon-sample-32px-extruded", "tiles");

  // Parameters: layer name (or index) from Tiled, tileset, x, y
  const belowLayer = map.createLayer("Below Player", tileset, 0, 0);
  const worldLayer = map.createLayer("World", tileset, 0, 0);
  const aboveLayer = map.createLayer("Above Player", tileset, 0, 0);

  worldLayer.setCollisionByProperty({ collides: true });

  // 기본적으로 모든 것은 우리가 생성한 순서대로 화면에서 깊이 정렬됨.
  // "Above Player" 레이어가 플레이어 위에 놓이길 원하므로 명시적으로 깊이를 지정.
  // 더 깊은 깊이는 더 얕은 깊이 객체 위에 놓임.(1 위에 2)
  aboveLayer.setDepth(10);

  // Tiled의 객체 레이어를 사용하면 생성 지점이나 사용자 지정과 같은 추가 정보를 지도에 포함 가능.
  // 충돌 모양. tmx 파일에는 "Spawn Point"라는 이름의 점이 있는 개체 레이어 존재.
  const spawnPoint = map.findObject("Objects", obj => obj.name === "Spawn Point");

  // 물리 시스템을 통해 물리가 활성화된 스프라이트를 만듬.
  // 스프라이트에 사용된 이미지는 약간의 공백이 있으므로 setSize 및 setOffset을 사용하여 플레이어의 몸 크기를 제어.
  
  player = this.physics.add.
  sprite(spawnPoint.x, spawnPoint.y, "atlas", "misa-front").
  setSize(30, 40).
  setOffset(0, 24);

  // 장면이 지속되는 동안 플레이어와 worldLayer가 충돌하는지 확인.
  this.physics.add.collider(player, worldLayer);

  // 텍스처 아틀라스에서 플레이어의 걷기 애니메이션을 만듬.
  // 이들은 전역에 저장. 모든 스프라이트가 액세스할 수 있도록 애니메이션 관리자.
  const anims = this.anims;
  anims.create({
    key: "misa-left-walk",
    frames: anims.generateFrameNames("atlas", { prefix: "misa-left-walk.", start: 0, end: 3, zeroPad: 3 }),
    frameRate: 10,
    repeat: -1 });

  anims.create({
    key: "misa-right-walk",
    frames: anims.generateFrameNames("atlas", { prefix: "misa-right-walk.", start: 0, end: 3, zeroPad: 3 }),
    frameRate: 10,
    repeat: -1 });

  anims.create({
    key: "misa-front-walk",
    frames: anims.generateFrameNames("atlas", { prefix: "misa-front-walk.", start: 0, end: 3, zeroPad: 3 }),
    frameRate: 10,
    repeat: -1 });

  anims.create({
    key: "misa-back-walk",
    frames: anims.generateFrameNames("atlas", { prefix: "misa-back-walk.", start: 0, end: 3, zeroPad: 3 }),
    frameRate: 10,
    repeat: -1 });


  const camera = this.cameras.main;
  camera.startFollow(player);
  camera.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

  cursors = this.input.keyboard.createCursorKeys();

  // 화면에서 "fixed" 위치에 있는 도움말 텍스트 (하얀박스 안의 글자)
  this.add.
  text(16, 16, 'Arrow keys to move\nPress "D" to show hitboxes', {
    font: "18px monospace",
    fill: "#000000",
    padding: { x: 20, y: 10 },
    backgroundColor: "#ffffff" }).

  setScrollFactor(0).
  setDepth(30);

  // Debug graphics
  this.input.keyboard.once("keydown-D", event => {
    // 플레이어의 히트박스를 표시하려면 물리 디버깅을 켜기.
    this.physics.world.createDebugGraphic();

    // 플레이어 위에 있지만 도움말 텍스트 아래에는 worldLayer 충돌 그래픽을 만듬.
    const graphics = this.add.
    graphics().
    setAlpha(0.75).
    setDepth(20);
    worldLayer.renderDebug(graphics, {
      tileColor: null, //충돌되지 않는 타일의 색
      collidingTileColor: new Phaser.Display.Color(243, 134, 48, 255), // 충돌되는 타일의 색
      faceColor: new Phaser.Display.Color(40, 39, 37, 255) // 충돌되는 면 가장자리의 색
    });
  });
}

function update(time, delta) {
  const speed = 175;
  const prevVelocity = player.body.velocity.clone();

  // 마지막 프레임에서 이전 이동을 중지.
  player.body.setVelocity(0);

  //수평 이동
  if (cursors.left.isDown) {
    player.body.setVelocityX(-speed);
  } else if (cursors.right.isDown) {
    player.body.setVelocityX(speed);
  }

  // 수직 이동
  if (cursors.up.isDown) {
    player.body.setVelocityY(-speed);
  } else if (cursors.down.isDown) {
    player.body.setVelocityY(speed);
  }

  // 플레이어가 대각선을 따라 더 빠르게 이동할 수 없도록 속도를 정규화하고 크기를 조정.
  player.body.velocity.normalize().scale(speed);

  // 애니메이션을 마지막으로 업데이트하고 위/아래 애니메이션보다 왼쪽/오른쪽 애니메이션을 우선.
  if (cursors.left.isDown) {
    player.anims.play("misa-left-walk", true);
  } else if (cursors.right.isDown) {
    player.anims.play("misa-right-walk", true);
  } else if (cursors.up.isDown) {
    player.anims.play("misa-back-walk", true);
  } else if (cursors.down.isDown) {
    player.anims.play("misa-front-walk", true);
  } else {
    player.anims.stop();

    // 우리가 움직이고 있다면 사용할 프레임을 선택하고 사용되지 않는 상태로 만듬.
    if (prevVelocity.x < 0) player.setTexture("atlas", "misa-left");else
    if (prevVelocity.x > 0) player.setTexture("atlas", "misa-right");else
    if (prevVelocity.y < 0) player.setTexture("atlas", "misa-back");else
    if (prevVelocity.y > 0) player.setTexture("atlas", "misa-front");
  }
}