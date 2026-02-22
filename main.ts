//  Snake on micro:bit v2 (MakeCode Python)
//  Deadly walls + skull on death + macabre death melody
//  Win at length 9: play long melody and scroll "PhD! Dr. Zhi! ..."
//  "Hi Zhi!" only appears once on boot
//  --- Config ---
let TICK_MS = 700
//  Movement speed (lower = faster)
let TEMPO_BPM = 120
//  Tempo for your long melody
let DEATH_TEMPO = 144
//  Tempo for the death melody (clear & recognizable)
let MIN_TICK_MS = 250
//  Do not go faster than this (cap)
//  Your provided melody (one octave lower)
let MELODY_STR = "A#3:2 C4:1 R:1 C4:1 R:1 C2:1 R:12 A#3:1 R:1 C4:1 R:1 C4:1 R:1 C2:1 R:1 C6:1 R:1 C6:1 R:1 C6:1 R:1 C6:1 R:1 C6:4 C6:1 R:1 D6:1 R:1 A#5:1 R:1 G5:1 R:1 G5:4 R:1 F5:1 R:1 G5:4 R:9 C6:1 R:1 C6:1 R:1 C6:1 R:1 D6:1 R:1 D#6:1 R:1 D6:4 A#3:1 R:1 C6:1 R:1 C4:1 R:1 D#6:1 R:3 D#6:1 R:3 D#6:1 R:1 D#6:1 R:1 F6:1 R:1 D#6:1 R:1 D6:1 R:3 D6:1 R:7 C6:1 R:1 D6:1 R:1 G6:1 R:3 G6:1 R:3 D#6:1 R:1 D#6:1 R:1 F6:1 R:1 D#6:1 R:1 G6:1 R:3 G6:1 R:5 G6:1 R:1 F6:1 R:1 D#6:1 R:3 C6:1 R:1 C6:1 R:1 C6:1 R:1 C6:1 R:5 C6:1 R:1 B5:1 R:1 C6:1 R:1 D6:1 R:3 G6:1 R:3 F6:1 R:1 D#6:1 R:1 D#5:1 R:1 D#6:1 R:1 D#6:1 R:1 D#6:1 R:1 D#6:1 R:5 D#6:1 R:1 F6:1 R:1 G6:1 R:1 G#6:1 R:1 G6:1 R:11 C6:1 R:1 C6:1 R:1 C6:1 R:1 C6:1 R:1 C6:1 R:1 C6:1 R:1 B5:1 R:1 C6:1 R:1 D6:1 R:4 D#6:1 R:1 F6:1 R:1 G6:1 R:1 G6:1 R:6 F6:1 D#6:1 F6:1 D#6:1 R:6 G6:1 R:1 G#6:1 R:1 G6:1 R:1 G#6:1 R:1 G6:1 R:1 G#6:1 R:1 G6:1 R:3 C5:1 R:1 C6:1 R:1 C6:1 R:1 C6:1 R:1 C6:1 R:1 C6:1 R:3 C6:1 R:1 D6:1 R:1 A#5:1 R:1 G5:1 R:1 G5:1 R:2 F5:1 R:1 G5:1"
//  Recognizable, darker death melody (Dies Irae–style motif)
let DEATH_MELODY = "D4:2 D#4:2 D4:2 C4:4 R:1 D4:2 D#4:2 D4:2 C4:4 R:2 G3:4"
//  --- Game state & Types ---
let W = 5
let H = 5
let snake : number[][] = []
//  list of [x, y]; head at index 0
let food = [0, 0]
let dir_ = 1
//  0=up, 1=right, 2=down, 3=left
let growing = 0
let alive = true
let won = false
let food_blink = false
//  for pulsing the food dot
//  --- Helpers ---
function turn_left() {
    
    dir_ = (dir_ + 3) % 4
}

function turn_right() {
    
    dir_ = (dir_ + 1) % 4
}

function next_head(): number[] {
    //  No wrapping: compute next cell; wall check is done in the loop
    let x = snake[0][0]
    let y = snake[0][1]
    let dx = dir_ == 1 ? 1 : (dir_ == 3 ? -1 : 0)
    let dy = dir_ == 2 ? 1 : (dir_ == 0 ? -1 : 0)
    return [x + dx, y + dy]
}

function on_snake(x: number, y: number): boolean {
    let k = 0
    while (k < snake.length) {
        if (snake[k][0] == x && snake[k][1] == y) {
            return true
        }
        
        k += 1
    }
    return false
}

function place_food() {
    let x: number;
    let y: number;
    //  ensure not on snake
    while (true) {
        x = randint(0, W - 1)
        y = randint(0, H - 1)
        if (!on_snake(x, y)) {
            food[0] = x
            food[1] = y
            break
        }
        
    }
}

function draw() {
    basic.clearScreen()
    //  draw body (dim)
    let k = 1
    while (k < snake.length) {
        led.plotBrightness(snake[k][0], snake[k][1], 90)
        k += 1
    }
    //  draw head (bright)
    led.plotBrightness(snake[0][0], snake[0][1], 255)
    //  draw food (blink)
    led.plotBrightness(food[0], food[1], food_blink ? 180 : 120)
}

function game_over() {
    //  Show skull + death melody, then restart (no "Hi Zhi!" again)
    
    alive = false
    music.stopAllSounds()
    basic.showIcon(IconNames.Skull)
    music.playMelody(DEATH_MELODY, DEATH_TEMPO)
    //  blocking so skull stays visible
    basic.pause(400)
    basic.clearScreen()
    reset_game()
}

function win_game() {
    //  Length 9 reached: play long melody and scroll text, then restart
    
    alive = false
    won = true
    music.stopAllSounds()
    //  Play your long melody in background while we scroll the text
    control.inBackground(function _win() {
        music.playMelody(MELODY_STR, TEMPO_BPM)
    })
    basic.showString("PhD! Dr. Zhi! PhD! Dr. Zhi! PhD! Dr. Zhi! PhD! Dr. Zhi!")
    basic.showIcon(IconNames.Happy)
    basic.pause(300)
    basic.clearScreen()
    music.stopAllSounds()
    reset_game()
}

function reset_game() {
    
    alive = true
    won = false
    dir_ = 1
    //  start heading right
    snake = [[2, 2], [1, 2], [0, 2]]
    growing = 0
    food_blink = false
    TICK_MS = 700
    //  reset speed each round
    place_food()
    draw()
}

//  --- Startup message (shown only once on boot) ---
basic.showString("Zhi, control the catheter!")
//  --- Inputs (v2) ---
input.onButtonPressed(Button.A, function on_a() {
    turn_left()
})
input.onButtonPressed(Button.B, function on_b() {
    turn_right()
})
input.onLogoEvent(TouchButtonEvent.Pressed, function on_logo() {
    reset_game()
})
//  --- Main ---
reset_game()
//  Run movement/game loop in background so inputs remain responsive
control.inBackground(function loop() {
    let nh: number[];
    
    while (true) {
        if (alive) {
            nh = next_head()
            //  --- Deadly walls ---
            if (nh[0] < 0 || nh[0] >= W || nh[1] < 0 || nh[1] >= H) {
                game_over()
            } else if (on_snake(nh[0], nh[1])) {
                game_over()
            } else {
                //  Move head
                snake.insertAt(0, nh)
                //  Eat?
                if (nh[0] == food[0] && nh[1] == food[1]) {
                    growing += 1
                    place_food()
                    //  Short happy tone on collect (very brief)
                    music.playTone(988, music.beat(BeatFraction.Sixteenth))
                    //  ~B5, 125 ms
                    //  Speed up slightly, but never below 400 ms
                    TICK_MS = Math.max(MIN_TICK_MS, Math.trunc(Math.idiv(TICK_MS * 80, 100)))
                }
                
                //  Grow or pop tail
                if (growing > 0) {
                    growing -= 1
                } else {
                    _py.py_array_pop(snake)
                }
                
                //  Win condition at length 9 (one-time trigger)
                if (!won && snake.length >= 9) {
                    win_game()
                }
                
                //  Toggle food blink and redraw
                food_blink = !food_blink
                draw()
            }
            
        }
        
        basic.pause(TICK_MS)
    }
})
