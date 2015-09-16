import {Constants} from './constants';
import {Faction} from './data/faction';
import {Tile} from './base/tile';
import {BuildingType} from './building/buildingtype';
import {Buildable} from './base/buildable';
import {Building} from './building/building';

import {DUnitType} from './unit/dunittype';
import {OUnitType} from './unit/ounittype';
import {Unit} from './unit/unit';

import {GameDataObject} from './data/gamedataobject';
import {CNCBase, CNCUnit, CNCTile} from '../client/client.base';

import {ID_MAP, TECH_MAP} from './util';
interface CNCLocation {
    x: number;
    y: number;
}
interface CNCBaseObject extends CNCLocation {
    building?: Buildable;
    tile?:Tile;
}

export class Base {
    private tiles:Tile[];
    private base:Buildable[];
    private upgrades:number[];

    constructor(private name?:string, private faction?:Faction) {
        this.name = this.name || 'Base';

        if (faction == null) {
            this.faction = Faction.GDI;
        }

        this.tiles = [];
        this.upgrades = [];
        this.base = [];
    }

    getName():string {
        return this.name;
    }

    getFaction():Faction {
        return this.faction;
    }

    getSurroundings(x:number, y:number, buildings?:number[], tiles?:Tile[]):CNCBaseObject[] {
        var output = [];
        for (var dx = -1; dx < 2; dx++) {
            for (var dy = -1; dy < 2; dy++) {
                var offX = x + dx;
                var offY = y + dy;
                if (offX < 0 || offX > Constants.MAX_BASE_X) {
                    continue;
                }
                if (offY < 0 || offY > Constants.MAX_BASE_Y) {
                    continue;
                }
                if (offY === y && offX === x) {
                    continue;
                }

                var building = this.getBase(offX, offY);
                var tile = this.getTile(offX, offY);
                if (building == null) {
                    if (tiles && tiles.indexOf(tile) > -1) {
                        output.push({
                            x: offX,
                            y: offY,
                            tile: tile
                        })
                    }
                    continue;
                }

                if (buildings == null && tiles == null) {
                    output.push({
                        x: offX,
                        y: offY,
                        building: building,
                        tile: tile
                    });
                    continue;
                }

                if (buildings != null) {
                    //console.log(building.getID(), building.getName(), buildings);
                    if (buildings.indexOf(building.getID()) > -1) {
                        output.push({
                            x: offX,
                            y: offY,
                            building: building,
                            tile: tile
                        });
                        continue;
                    }
                }

                if (tiles != null) {
                    //console.log(tile.getCode(), tiles);
                    if (tiles.indexOf(tile) > -1) {
                        output.push({
                            x: offX,
                            y: offY,
                            building: building,
                            tile: tile
                        });
                        continue;
                    }
                }


            }
        }
        return output;
    }

    static getSurroundingXY(x:number, y:number):CNCLocation[] {
        var output = [];
        for (var dx = -1; dx < 2; dx++) {
            for (var dy = -1; dy < 2; dy++) {
                var offX = x + dx;
                var offY = y + dy;
                if (offX < 0 || offX > Constants.MAX_BASE_X) {
                    continue;
                }
                if (offY < 0 || offY > Constants.MAX_BASE_Y) {
                    continue;
                }
                if (offY === y && offX === x) {
                    continue;
                }
                output.push({x: offX, y: offY});
            }
        }

        return output;
    }

    static $index(x:number, y:number) {
        return x + y * Constants.MAX_BASE_X;
    }

    baseForEach(callback:(x:number, y:number, building:Buildable, tile:Tile, base:Base) => void) {
        for (var y = 0; y < Constants.MAX_Y; y++) {
            for (var x = 0; x < Constants.MAX_BASE_X; x++) {
                var index = Base.$index(x, y);
                callback(x, y, this.base[index], this.tiles[index], this);
            }
        }
    }

    buildingsForEach(callback:(x:number, y:number, building:Building, tile:Tile, base:Base) => any):any[] {
        var output = [];
        for (var y = 0; y < Constants.MAX_BASE_Y; y++) {
            for (var x = 0; x < Constants.MAX_BASE_X; x++) {
                var index = Base.$index(x, y);
                output.push(callback(x, y, <Building>this.base[index], this.getTile(x, y), this));
            }
        }
        return output;
    }

    getTile(x:number, y:number) {
        return this.tiles[Base.$index(x, y)] || Tile.Empty;
    }

    setTile(x:number, y:number, tile:Tile) {
        this.tiles[Base.$index(x, y)] = tile;
    }

    getBase(x:number, y:number):Buildable {
        return this.base[Base.$index(x, y)];
    }

    setBase(x:number, y:number, buildable:Buildable) {
        this.base[Base.$index(x, y)] = buildable;
    }

    setUpgrades(upgrades:number[]) {
        this.upgrades = upgrades;
    }

    hasUpgrade(unitID:number) {
        return this.upgrades.indexOf(unitID) !== -1;
    }

    static load(cncbase:CNCBase):Base {
        var output = new Base(cncbase.name, Faction.fromID(cncbase.faction));

        for (var y = 0; y < Constants.MAX_Y; y++) {
            for (var x = 0; x < Constants.MAX_BASE_X; x++) {
                var index = x + '-' + y; // Base.$index(x, y);
                var unit = cncbase.tiles[index];
                var tile:Tile;

                if (unit == null) {
                    continue;
                }

                // Give just a number so just a tile
                if (typeof unit === 'number') {
                    tile = Tile.ID[<number>unit];
                    output.setTile(x, y, tile);
                    continue;
                }

                var actualUnit:CNCTile = <CNCTile>unit;
                var unitType:GameDataObject = ID_MAP[actualUnit.id];
                if (unitType == null) {
                    console.error('Unknown unit', actualUnit.id, '@', x, y);
                    continue;
                }

                if (actualUnit.t) {
                    tile = Tile.ID[actualUnit.t];
                    output.setTile(x, y, tile);
                }

                if (unitType instanceof BuildingType) {
                    output.setBase(x, y, new Building(<BuildingType>unitType, actualUnit.l));
                } else if (unitType instanceof OUnitType) {
                    output.setBase(x, y, new Unit(<OUnitType>unitType, actualUnit.l));
                } else if (unitType instanceof DUnitType) {
                    output.setBase(x, y, new Unit(<DUnitType>unitType, actualUnit.l));
                } else {
                    console.error('Unknown unitType', unitType);
                }

            }
        }

        output.setUpgrades(cncbase.upgrades);
        return output;
    }

    toString() {
        function toStr(u) {
            return u.toString();
        }

        function removeEmpty(o) {
            return o != null;
        }

        return `[Base ${this.name}:${this.faction}
    buildings: [${ this.base.filter(removeEmpty).map(toStr).join('\n\t') })}]
        ]`;
    }


}
