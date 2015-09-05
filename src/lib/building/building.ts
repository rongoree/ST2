import {BuildingType} from './buildingtype';
import {Buildable} from '../base/buildable';
import {Tile} from '../base/tile';

export class Building implements Buildable {

    constructor(private building:BuildingType, private level:number) {
    }

    getLevel():number {
        return this.level;
    }

    setLevel(level:number) {
        this.level = level;
    }

    getHealth() {
        return this.building.getHealth(this.level);
    }

    getID():number {
        return this.building.getID();
    }

    getClassName():string {
        return this.building.getClassName();
    }

    getName():string {
        return this.building.getName();
    }

    getCost() {
        return this.building.getCost(this.level);
    }

    getPlunder() {
        return this.building.getPlunder(this.level);
    }

    canBuildOn(x:number, y:number, tile:Tile):boolean {
        return this.building.canBuildOn(x, y, tile);
    }

    getGameData() {
        return this.building.getGameData();
    }

    toString() {
        return `[Building: ${this.building.toString()}: ${this.level}]`;
    }
}
