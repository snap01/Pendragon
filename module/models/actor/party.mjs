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
        new ForeignDocumentField(foundry.documents.BaseActor, { idOnly: true }),
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
    return this.members.map((a) => ({ actor: a }));
  }
}
