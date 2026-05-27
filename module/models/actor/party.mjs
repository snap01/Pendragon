const {
  HTMLField,
  SchemaField,
  NumberField,
  StringField,
  ForeignDocumentField,
  ArrayField,
  BooleanField,
} = foundry.data.fields;

export class PartyData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      members: new ArrayField(
        new ForeignDocumentField(foundry.documents.BaseActor),
      ),
    };
  }

  static migrateData(source) {
    // migrate from {uuid: "Actor.id"} to documentId for ForeignDocumentField
    source.members = source.members.map((m) => {
      if (foundry.utils.getType(m) !== "Object") return m;
      if (m.uuid.startsWith("Actor.")) return m.uuid.slice(6);
      return m;
    });
    return super.migrateData(source);
  }

  async getMembers() {
    return this.members.map((a) => ({ actor: a() }));
  }
  async addMember(actor) {
    const membersCollection = this.toObject().members;
    membersCollection.push(actor.id);
    return this.parent.update({ "system.members": membersCollection });
  }

  async removeMember(actor) {
    const membersCollection = this.toObject().members;
    let actorId = actor;
    if (actor instanceof Actor) actorId = actor.id;
    membersCollection.findSplice((u) => u == actorId);
    return this.parent.update({ "system.members": membersCollection });
  }
}
