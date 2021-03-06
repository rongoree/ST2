import {ParseWebUtil} from '../parse';
import {Log} from "../../../lib/log/log";
import {ParseJSONWorldObject} from "../../../lib/objects/world";
import {ParseJSONAllianceObject} from "../../../lib/objects/alliance";
import * as Layout from '../layout/layout';

var $log = Log.child({route: 'AllianceWorldSelector'});


export class AllianceWorldSelector {

    private loadingAlliances;
    private worlds:_mithril.MithrilProperty<ParseJSONWorldObject[]>;
    private alliances:_mithril.MithrilProperty<ParseJSONAllianceObject[]>;
    private worldMap:{[key:string] : ParseJSONWorldObject};

    constructor() {
        this.loadingAlliances = m.prop(true);
        this.alliances = m.prop([]);
        this.worlds = m.prop([]);
        this.worldMap = {};


        ParseWebUtil.query('Alliance', ParseWebUtil.lastUpdatedAt(), $log).then((allianceData) => {
            allianceData.results.forEach(function (result) {
                result.createdAt = new Date(result.createdAt);
                result.updatedAt = new Date(result.updatedAt);
            });
            this.alliances(allianceData.results.sort((a, b) => {
                return b.updatedAt - a.updatedAt;
            }));
            this.loadingAlliances(false);
        });

        ParseWebUtil.query('World', {}, $log).then((worldData) => {
            worldData.results.forEach((world:ParseJSONWorldObject) => {
                this.worldMap[world.world] = world;
            });
            this.worlds(worldData.results);
        });

    }

    loading() {
        return this.loadingAlliances() || this.worlds().length === 0
    }

    view() {
        if (this.loading()) {
            return;
        }

        if (this.alliances().length === 0) {
            return Layout.createLayout({
                page: 'Alliance'
            }, [
                m('div.AllianceWorldSelect', [
                    m('div.AllianceWorldSelect-Title', 'No Alliances found!'),
                    m('div.AllianceWorldSelect-Info',
                        'This is caused by not having the ST extension installed'),
                    m('div.AllianceWorldSelect-Info', [
                        'Please install it from ',
                        m('a', {
                            href: '#/install'
                        }, 'here')
                    ])
                ])
            ]);
        }

        var alliances = this.alliances().map(this.viewAlliance, this);

        return Layout.createLayout({
            page: 'Alliance'
        }, [
            m('div.AllianceWorldSelect', [
                m('div.AllianceWorldSelect-Title', 'Select your world'),
                m('div.AllianceWorldSelect-Alliances', alliances)
            ])
        ]);
    }

    viewAlliance(alliance:ParseJSONAllianceObject) {
        var worldObj:ParseJSONWorldObject = this.worldMap[alliance.world];
        if (worldObj == null) {
            return;
        }
        return m(`div.AllianceWorld AllianceWorld-${alliance.world}`, {
            onclick: () => {
                m.route(`/alliance/${alliance.world}`);
            }
        }, [
            m('div.AllianceWorld-World', worldObj.name),
            m('div.AllianceWorld-Name', alliance.name)
        ])
    }


    static controller() {
        return new AllianceWorldSelector();
    }

    static view(ctrl:AllianceWorldSelector) {
        return ctrl.view();
    }
}