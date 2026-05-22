const {
  HTMLField,
  SchemaField,
  NumberField,
  StringField,
  DocumentUUIDField,
  ForeignDocumentField,
  ArrayField,
  BooleanField,
} = foundry.data.fields;

export class BattleData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      encounters: new ArrayField(new StringField()),
      knights: new ArrayField(
        new ForeignDocumentField(foundry.documents.BaseActor),
      ),
      shortDesc: new StringField(),
      fieldPos: new StringField(),
      description: new HTMLField(),
      notes: new HTMLField(),
      maxTurns: new NumberField({ integer: true, default: 8 }),
      currTurn: new NumberField({ integer: true, default: 1 }),
      battleScore: new NumberField({ integer: true, default: 0 }),
      intensity: new NumberField({ integer: true, default: 0 }),
      maxMorale: new NumberField({ integer: true, default: 0 }),
      currMorale: new NumberField({ integer: true, default: 0 }),
      lock: new BooleanField(),
      noteView: new BooleanField(),
      descripView: new BooleanField(),
      encView: new BooleanField(),
    };
  }
  static migrateData(source) {
    // migrate from {uuid: "Actor.id"} to documentId for ForeignDocumentField
    source.knights = source.knights.map((m) => {
      if (foundry.utils.getType(m) !== "Object") return m;
      if (m.uuid.startsWith("Actor.")) return m.uuid.slice(6);
      return m;
    });

    // we are only storing UUIDs after migration
    source.encounters = source.encounters.map((m) => {
      if (foundry.utils.getType(m) !== "Object") return m;
      if (m.uuid) return m.uuid;
      return m;
    });
    return source;
  }

  async getEncounters() {
    // Batch compendium lookups when retrieving members.
    const collections = new Map();
    const members = new Map();

    for (const uuid of this.encounters) {
      const { collection, id } = foundry.utils.parseUuid(uuid);
      let ids = collections.get(collection);
      if (!ids) {
        ids = [];
        collections.set(collection, ids);
      }
      ids.push(id);
      members.set(id, collection);
    }

    for (const [collection, ids] of collections.entries()) {
      if (
        collection instanceof foundry.documents.collections.CompendiumCollection
      ) {
        await collection.getDocuments({ _id__in: ids });
      }
    }

    return Array.from(
      members
        .entries()
        .map(([id, collection]) => {
          return { actor: collection.get(id) };
        })
        .filter((d) => d.actor),
    );
  }
}
