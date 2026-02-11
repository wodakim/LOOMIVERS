
export class MapGenerator {
    constructor(width, height, tileSize) {
        this.width = width;   // In pixels
        this.height = height; // In pixels
        this.tileSize = tileSize;
        this.cols = Math.ceil(width / tileSize);
        this.rows = Math.ceil(height / tileSize);
        this.grid = []; // 0 = Floor, 1 = Wall
    }

    generate() {
        console.log(`Generating Map: ${this.cols}x${this.rows}`);
        this.initializeGrid();

        // Cellular Automata Steps
        for (let i = 0; i < 5; i++) {
            this.smoothMap();
        }

        // Ensure Connectivity (Flood Fill)
        this.ensureConnectivity();

        // Add Border Walls (Unbreakable)
        this.addBorders();

        return this.grid;
    }

    // Place Crates
    placeDestructibles(entityManager) {
        // Simple scan: if floor has > 5 free neighbors, 5% chance to place crate
        // We need component classes imported? Or pass a factory?
        // MapGenerator should just return a list of destructibles OR we pass entityManager to it?
        // Let's return a list of {x, y, type} for Main.js to spawn

        const objects = [];
        for (let y = 1; y < this.rows - 1; y++) {
            for (let x = 1; x < this.cols - 1; x++) {
                if (this.grid[y][x] === 0) {
                    // Check neighbors
                    let floorNeighbors = 0;
                    for (let dy = -1; dy <= 1; dy++) {
                        for (let dx = -1; dx <= 1; dx++) {
                            if (this.grid[y+dy][x+dx] === 0) floorNeighbors++;
                        }
                    }

                    if (floorNeighbors >= 8 && Math.random() < 0.02) {
                        objects.push({
                            x: x * this.tileSize + this.tileSize/2,
                            y: y * this.tileSize + this.tileSize/2,
                            type: 'crate'
                        });
                    }
                }
            }
        }
        return objects;
    }

    initializeGrid() {
        this.grid = [];
        for (let y = 0; y < this.rows; y++) {
            const row = [];
            for (let x = 0; x < this.cols; x++) {
                // Random Noise: 45% Walls
                if (Math.random() < 0.45) {
                    row.push(1);
                } else {
                    row.push(0);
                }
            }
            this.grid.push(row);
        }
    }

    smoothMap() {
        const newGrid = [];
        for (let y = 0; y < this.rows; y++) {
            const row = [];
            for (let x = 0; x < this.cols; x++) {
                const neighbors = this.countWallNeighbors(x, y);
                if (neighbors > 4) {
                    row.push(1); // Become Wall
                } else if (neighbors < 4) {
                    row.push(0); // Become Floor
                } else {
                    row.push(this.grid[y][x]); // Stay same
                }
            }
            newGrid.push(row);
        }
        this.grid = newGrid;
    }

    countWallNeighbors(gridX, gridY) {
        let count = 0;
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                if (dx === 0 && dy === 0) continue;

                const nx = gridX + dx;
                const ny = gridY + dy;

                // Out of bounds = Wall
                if (nx < 0 || ny < 0 || nx >= this.cols || ny >= this.rows) {
                    count++;
                } else if (this.grid[ny][nx] === 1) {
                    count++;
                }
            }
        }
        return count;
    }

    ensureConnectivity() {
        const regions = [];
        const visitedGlobal = new Set();
        const dirs = [[0,1], [0,-1], [1,0], [-1,0]];

        // Identify all disconnected regions
        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                if (this.grid[y][x] === 0 && !visitedGlobal.has(`${x},${y}`)) {
                    const region = [];
                    const q = [{x, y}];
                    visitedGlobal.add(`${x},${y}`);

                    while (q.length > 0) {
                        const curr = q.pop();
                        region.push(curr);

                        for (const [dx, dy] of dirs) {
                            const nx = curr.x + dx;
                            const ny = curr.y + dy;
                            if (nx >= 0 && nx < this.cols && ny >= 0 && ny < this.rows) {
                                if (this.grid[ny][nx] === 0 && !visitedGlobal.has(`${nx},${ny}`)) {
                                    visitedGlobal.add(`${nx},${ny}`);
                                    q.push({x: nx, y: ny});
                                }
                            }
                        }
                    }
                    regions.push(region);
                }
            }
        }

        // Find Largest Region
        regions.sort((a, b) => b.length - a.length);

        if (regions.length > 0) {
            const mainRegion = regions[0];
            console.log(`Map Generator: Main Region has ${mainRegion.length} tiles.`);

            // Turn all other regions into Walls to prevent getting stuck
            for (let i = 1; i < regions.length; i++) {
                for (const tile of regions[i]) {
                    this.grid[tile.y][tile.x] = 1;
                }
            }
            console.log(`Map Generator: Removed ${regions.length - 1} disconnected regions.`);
        } else {
            // Map is full walls? Force a center room.
            console.warn("Map Generator: Map was solid walls! Clearing center.");
            const cx = Math.floor(this.cols/2);
            const cy = Math.floor(this.rows/2);
            for(let y=cy-5; y<=cy+5; y++) {
                for(let x=cx-5; x<=cx+5; x++) {
                    this.grid[y][x] = 0;
                }
            }
        }
    }

    addBorders() {
        // Enforce 1-tile border
        for (let x = 0; x < this.cols; x++) {
            this.grid[0][x] = 1;
            this.grid[this.rows - 1][x] = 1;
        }
        for (let y = 0; y < this.rows; y++) {
            this.grid[y][0] = 1;
            this.grid[y][this.cols - 1] = 1;
        }
    }

    getSpawnPoint() {
        const cx = Math.floor(this.cols / 2);
        const cy = Math.floor(this.rows / 2);

        // Search in expanding rings for a valid floor tile
        for (let r = 0; r < Math.max(this.cols, this.rows); r++) {
             // Check ring perimeter
             for (let i = -r; i <= r; i++) {
                 const pts = [
                     {x: cx + i, y: cy - r},
                     {x: cx + i, y: cy + r},
                     {x: cx - r, y: cy + i},
                     {x: cx + r, y: cy + i}
                 ];

                 for (const p of pts) {
                     if (this.isSafe(p.x, p.y)) {
                         // Return pixel center of tile
                         return {
                             x: p.x * this.tileSize + this.tileSize/2,
                             y: p.y * this.tileSize + this.tileSize/2
                         };
                     }
                 }
             }
        }
        return { x: 100, y: 100 };
    }

    isSafe(gx, gy) {
        if (gx < 0 || gy < 0 || gx >= this.cols || gy >= this.rows) return false;
        return this.grid[gy][gx] === 0;
    }
}
