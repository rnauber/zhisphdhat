# Snake on micro:bit v2 (MakeCode Python)
# Deadly walls + skull on death + macabre death melody
# Win at length 9: play long melody and scroll "PhD! Dr. Zhi! ..."
# "Hi Zhi!" only appears once on boot

# --- Config ---
TICK_MS = 700           # Movement speed (lower = faster)
TEMPO_BPM = 120         # Tempo for your long melody
DEATH_TEMPO = 144       # Tempo for the death melody (clear & recognizable)
MIN_TICK_MS = 300       # Do not go faster than this (cap)

# Your provided melody (one octave lower)
MELODY_STR = "A#3:2 C4:1 R:1 C4:1 R:1 C2:1 R:12 A#3:1 R:1 C4:1 R:1 C4:1 R:1 C2:1 R:1 C6:1 R:1 C6:1 R:1 C6:1 R:1 C6:1 R:1 C6:4 C6:1 R:1 D6:1 R:1 A#5:1 R:1 G5:1 R:1 G5:4 R:1 F5:1 R:1 G5:4 R:9 C6:1 R:1 C6:1 R:1 C6:1 R:1 D6:1 R:1 D#6:1 R:1 D6:4 A#3:1 R:1 C6:1 R:1 C4:1 R:1 D#6:1 R:3 D#6:1 R:3 D#6:1 R:1 D#6:1 R:1 F6:1 R:1 D#6:1 R:1 D6:1 R:3 D6:1 R:7 C6:1 R:1 D6:1 R:1 G6:1 R:3 G6:1 R:3 D#6:1 R:1 D#6:1 R:1 F6:1 R:1 D#6:1 R:1 G6:1 R:3 G6:1 R:5 G6:1 R:1 F6:1 R:1 D#6:1 R:3 C6:1 R:1 C6:1 R:1 C6:1 R:1 C6:1 R:5 C6:1 R:1 B5:1 R:1 C6:1 R:1 D6:1 R:3 G6:1 R:3 F6:1 R:1 D#6:1 R:1 D#5:1 R:1 D#6:1 R:1 D#6:1 R:1 D#6:1 R:1 D#6:1 R:5 D#6:1 R:1 F6:1 R:1 G6:1 R:1 G#6:1 R:1 G6:1 R:11 C6:1 R:1 C6:1 R:1 C6:1 R:1 C6:1 R:1 C6:1 R:1 C6:1 R:1 B5:1 R:1 C6:1 R:1 D6:1 R:4 D#6:1 R:1 F6:1 R:1 G6:1 R:1 G6:1 R:6 F6:1 D#6:1 F6:1 D#6:1 R:6 G6:1 R:1 G#6:1 R:1 G6:1 R:1 G#6:1 R:1 G6:1 R:1 G#6:1 R:1 G6:1 R:3 C5:1 R:1 C6:1 R:1 C6:1 R:1 C6:1 R:1 C6:1 R:1 C6:1 R:3 C6:1 R:1 D6:1 R:1 A#5:1 R:1 G5:1 R:1 G5:1 R:2 F5:1 R:1 G5:1"

# Recognizable, darker death melody (Dies Irae–style motif)
DEATH_MELODY = "D4:2 D#4:2 D4:2 C4:4 R:1 D4:2 D#4:2 D4:2 C4:4 R:2 G3:4"

# --- Game state & Types ---
W = 5
H = 5

snake: List[List[number]] = []   # list of [x, y]; head at index 0
food: List[number] = [0, 0]

dir_ = 1            # 0=up, 1=right, 2=down, 3=left
growing = 0
alive = True
won = False
food_blink = False  # for pulsing the food dot

# --- Helpers ---
def turn_left():
    global dir_
    dir_ = (dir_ + 3) % 4

def turn_right():
    global dir_
    dir_ = (dir_ + 1) % 4

def next_head():
    # No wrapping: compute next cell; wall check is done in the loop
    x = snake[0][0]
    y = snake[0][1]
    dx = 1 if dir_ == 1 else (-1 if dir_ == 3 else 0)
    dy = 1 if dir_ == 2 else (-1 if dir_ == 0 else 0)
    return [x + dx, y + dy]

def on_snake(x: number, y: number) -> bool:
    k = 0
    while k < len(snake):
        if snake[k][0] == x and snake[k][1] == y:
            return True
        k += 1
    return False

def place_food():
    # ensure not on snake
    while True:
        x = randint(0, W - 1)
        y = randint(0, H - 1)
        if not on_snake(x, y):
            food[0] = x
            food[1] = y
            break

def draw():
    basic.clear_screen()
    # draw body (dim)
    k = 1
    while k < len(snake):
        led.plot_brightness(snake[k][0], snake[k][1], 90)
        k += 1
    # draw head (bright)
    led.plot_brightness(snake[0][0], snake[0][1], 255)
    # draw food (blink)
    led.plot_brightness(food[0], food[1], 180 if food_blink else 120)

def game_over():
    # Show skull + death melody, then restart (no "Hi Zhi!" again)
    global alive
    alive = False
    music.stop_all_sounds()
    basic.show_icon(IconNames.SKULL)
    music.play_melody(DEATH_MELODY, DEATH_TEMPO)   # blocking so skull stays visible
    basic.pause(400)
    basic.clear_screen()
    reset_game()

def win_game():
    # Length 9 reached: play long melody and scroll text, then restart
    global alive, won
    alive = False
    won = True
    music.stop_all_sounds()

    # Play your long melody in background while we scroll the text
    def _win():
        music.play_melody(MELODY_STR, TEMPO_BPM)
    control.in_background(_win)

    basic.show_string("PhD! Dr. Zhi! PhD! Dr. Zhi! PhD! Dr. Zhi! PhD! Dr. Zhi!")
    basic.show_icon(IconNames.HAPPY)
    basic.pause(300)
    basic.clear_screen()
    music.stop_all_sounds()
    reset_game()

def reset_game():
    global alive, dir_, snake, growing, food_blink, TICK_MS, won
    alive = True
    won = False
    dir_ = 1  # start heading right
    snake = [[2, 2], [1, 2], [0, 2]]
    growing = 0
    food_blink = False
    TICK_MS = 700                 # reset speed each round
    place_food()
    draw()

# --- Startup message (shown only once on boot) ---
basic.show_string("Hi Zhi!")

# --- Inputs (v2) ---
def on_a():
    turn_left()
input.on_button_pressed(Button.A, on_a)

def on_b():
    turn_right()
input.on_button_pressed(Button.B, on_b)

def on_logo():
    reset_game()
input.on_logo_event(TouchButtonEvent.PRESSED, on_logo)

# --- Main ---
reset_game()

def loop():
    global growing, food_blink, TICK_MS
    while True:
        if alive:
            nh = next_head()

            # --- Deadly walls ---
            if nh[0] < 0 or nh[0] >= W or nh[1] < 0 or nh[1] >= H:
                game_over()
            else:
                # Self collision?
                if on_snake(nh[0], nh[1]):
                    game_over()
                else:
                    # Move head
                    snake.insert(0, nh)

                    # Eat?
                    if nh[0] == food[0] and nh[1] == food[1]:
                        growing += 1
                        place_food()

                        # Short happy tone on collect (very brief)
                        music.play_tone(988, music.beat(BeatFraction.SIXTEENTH))  # ~B5, 125 ms

                        # Speed up slightly, but never below 400 ms
                        TICK_MS = max(MIN_TICK_MS, int(TICK_MS * 80 // 100))

                    # Grow or pop tail
                    if growing > 0:
                        growing -= 1
                    else:
                        snake.pop()

                    # Win condition at length 9 (one-time trigger)
                    if (not won) and len(snake) >= 9:
                        win_game()

                    # Toggle food blink and redraw
                    food_blink = not food_blink
                    draw()

        basic.pause(TICK_MS)

# Run movement/game loop in background so inputs remain responsive
control.in_background(loop)
