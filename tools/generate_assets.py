import os

ASSETS_DIR = 'assets/sprites'
JS_OUTPUT_PATH = 'src/data/AssetManifest.js'

# Definitions: (Folder, FilenameRoot, Count, Width, Height, Color, Description)
definitions = [
    # Player
    ('player', 'player_idle', 1, 64, 64, '#00ccff', 'Player Idle'),
    ('player', 'player_run', 4, 64, 64, '#00ccff', 'Player Running (4 frames)'),
    ('player', 'player_attack', 2, 64, 64, '#00ccff', 'Player Attacking'),

    # Enemies - Tier 1 (Zombie)
    ('enemies/tier1', 'zombie_walk', 4, 48, 48, '#ff3333', 'Basic Zombie Walk'),
    ('enemies/tier1', 'zombie_attack', 2, 48, 48, '#ff0000', 'Basic Zombie Attack'),

    # Enemies - Tier 2 (Skeleton)
    ('enemies/tier2', 'skeleton_walk', 4, 40, 40, '#cccccc', 'Fast Skeleton Walk'),
    ('enemies/tier2', 'skeleton_attack', 2, 40, 40, '#ffffff', 'Fast Skeleton Attack'),

    # Enemies - Tier 3 (Orc)
    ('enemies/tier3', 'orc_walk', 4, 80, 80, '#006600', 'Tank Orc Walk'),
    ('enemies/tier3', 'orc_attack', 2, 80, 80, '#009900', 'Tank Orc Attack'),

    # Boss
    ('enemies/boss', 'boss_idle', 2, 128, 128, '#9900cc', 'Boss Idle'),
    ('enemies/boss', 'boss_attack', 3, 128, 128, '#cc00ff', 'Boss Attack Phase'),

    # Environment - Tiles
    ('environment/tiles', 'tile_grass', 1, 64, 64, '#228822', 'Grass Tile'),
    ('environment/tiles', 'tile_dirt', 1, 64, 64, '#885522', 'Dirt Tile'),
    ('environment/tiles', 'tile_water', 1, 64, 64, '#0055ff', 'Water Tile'),
    ('environment/tiles', 'tile_lava', 1, 64, 64, '#ff5500', 'Lava Tile'),

    # Environment - Decor
    ('environment/decor', 'decor_tree', 1, 96, 128, '#115511', 'Tree Decor'),
    ('environment/decor', 'decor_rock', 1, 48, 48, '#555555', 'Rock Decor'),

    # VFX
    ('vfx', 'vfx_explosion', 4, 64, 64, '#ffaa00', 'Explosion Effect'),
    ('vfx', 'vfx_hit', 2, 32, 32, '#ffff00', 'Hit Flash'),

    # UI Icons
    ('ui', 'icon_heart', 1, 32, 32, '#ff0000', 'Heart Icon'),
    ('ui', 'icon_sword', 1, 32, 32, '#aaaaaa', 'Sword Icon'),
]

def create_svg(filename, width, height, color, text):
    svg_content = f'''<svg width="{width}" height="{height}" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="{color}" stroke="white" stroke-width="2"/>
    <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="10" fill="white">{text}</text>
</svg>'''

    os.makedirs(os.path.dirname(filename), exist_ok=True)
    with open(filename, 'w') as f:
        f.write(svg_content)

def main():
    print("Generating assets...")
    folder_infos = {}
    js_sources = []
    js_animations = []

    for folder_rel, root_name, count, w, h, color, desc in definitions:
        folder_path = os.path.join(ASSETS_DIR, folder_rel)

        # Info
        if folder_path not in folder_infos:
            folder_infos[folder_path] = []
        folder_infos[folder_path].append(f"Name: {root_name}\nSize: {w}x{h}\nDescription: {desc}\n")

        # Images & JS
        frames = []
        if count == 1:
            fname = f"{root_name}.svg"
            filepath = os.path.join(folder_path, fname)
            create_svg(filepath, w, h, color, root_name)

            web_path = filepath.replace(os.sep, '/')
            js_sources.append(f"    '{root_name}': '{web_path}',")
            frames.append(f"'{root_name}'")
        else:
            for i in range(1, count + 1):
                fname = f"{root_name}_{i}.svg"
                label = f"{root_name} {i}"
                filepath = os.path.join(folder_path, fname)
                create_svg(filepath, w, h, color, label)

                key = f"{root_name}_{i}"
                web_path = filepath.replace(os.sep, '/')
                js_sources.append(f"    '{key}': '{web_path}',")
                frames.append(f"'{key}'")

        # Animation definition
        frame_list = ", ".join(frames)
        js_animations.append(f"    '{root_name}': [{frame_list}],")

    # Write Info Files
    for folder_path, infos in folder_infos.items():
        os.makedirs(folder_path, exist_ok=True)
        with open(os.path.join(folder_path, 'info.txt'), 'w') as f:
            f.write("ASSET MANIFEST\n================\n\n")
            f.write("\n".join(infos))
            f.write("\nInstructions: Replace these placeholders with pixel art assets matching the dimensions.\n")

    # Write JS Manifest
    os.makedirs(os.path.dirname(JS_OUTPUT_PATH), exist_ok=True)
    with open(JS_OUTPUT_PATH, 'w') as f:
        f.write("export const AssetSources = {\n")
        f.write("\n".join(js_sources))
        f.write("\n};\n\n")

        f.write("export const Animations = {\n")
        f.write("\n".join(js_animations))
        f.write("\n};\n")

    print(f"Asset generation complete. Manifest written to {JS_OUTPUT_PATH}")

if __name__ == "__main__":
    main()
