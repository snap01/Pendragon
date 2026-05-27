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
    if (source.knights) {
      source.knights = source.knights.map((m) => {
        if (foundry.utils.getType(m) !== "Object") return m;
        if (m.uuid.startsWith("Actor.")) return m.uuid.slice(6);
        return m;
      });
    }

    // we are only storing UUIDs after migration
    if (source.encounters) {
      source.encounters = source.encounters.map((m) => {
        if (foundry.utils.getType(m) !== "Object") return m;
        if (m.uuid) return m.uuid;
        return m;
      });
    }
    return source;
  }

  async getEncounters() {
    // Batch compendium lookups when retrieving members.
    const collections = new Map();
    const members = new Map();
    const worldMembers = [];

    for (const uuid of this.encounters) {
      const { collection, id } = foundry.utils.parseUuid(uuid);
      if (
        collection instanceof foundry.documents.collections.CompendiumCollection
      ) {
        let ids = collections.get(collection);
        if (!ids) {
          ids = [];
          collections.set(collection, ids);
        }
        ids.push(id);
        members.set(id, collection);
      } else {
        worldMembers.push({ actor: await fromUuid(uuid) });
      }
    }

    for (const [collection, ids] of collections.entries()) {
      if (
        collection instanceof foundry.documents.collections.CompendiumCollection
      ) {
        await collection.getDocuments({ _id__in: ids });
      }
    }

    const actors = Array.from(
      members
        .entries()
        .map(([id, collection]) => {
          if (
            collection instanceof
            foundry.documents.collections.CompendiumCollection
          ) {
            return { actor: collection.get(id) };
          }
        })
        .filter((d) => d.actor),
    );
    return actors.concat(worldMembers);
  }

  async addEncounter(actor) {
    const membersCollection = this.toObject().encounters;
    membersCollection.push(actor.uuid);
    return this.parent.update({ "system.encounters": membersCollection });
  }

  async removeEncounter(actor) {
    const membersCollection = this.toObject().encounters;
    let actorId = actor;
    if (actor instanceof Actor) actorId = actor.uuid;
    membersCollection.findSplice((u) => u == actorId);
    return this.parent.update({ "system.encounters": membersCollection });
  }

  async getKnights() {
    return this.knights.map((a) => ({ actor: a() }));
  }
  async addKnight(actor) {
    const membersCollection = this.toObject().knights;
    membersCollection.push(actor.id);
    return this.parent.update({ "system.knights": membersCollection });
  }

  async removeKnight(actor) {
    const membersCollection = this.toObject().knights;
    let actorId = actor;
    if (actor instanceof Actor) actorId = actor.id;
    membersCollection.findSplice((u) => u == actorId);
    return this.parent.update({ "system.knights": membersCollection });
  }
}
