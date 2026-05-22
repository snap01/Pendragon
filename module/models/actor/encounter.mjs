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

export class EncounterData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      npcs: new ArrayField(new DocumentUUIDField({ type: "Actor" })),
      shortDesc: new StringField(),
      moraleLoss: new StringField(),
      description: new HTMLField(),
      notes: new HTMLField(),
      moraleMin: new NumberField({ integer: true, default: 0 }),
      numOpp: new NumberField({ integer: true, default: 1 }),
      npcView: new NumberField({ integer: true, default: 99 }),
      opportunity: new BooleanField(),
      lock: new BooleanField(),
      noteView: new BooleanField(),
      used: new BooleanField(),
    };
  }

  static migrateData(source) {
    // we are only storing UUIDs after migration
    source.npcs = source.npcs.map((m) => {
      if (foundry.utils.getType(m) !== "Object") return m;
      if (m.uuid) return m.uuid;
      return m;
    });
    return source;
  }

  async getMembers() {
    // Batch compendium lookups when retrieving members.
    const collections = new Map();
    const members = new Map();

    for (const uuid of this.npcs) {
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
