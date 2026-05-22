const {
  HTMLField,
  SchemaField,
  NumberField,
  StringField,
  FilePathField,
  ArrayField,
  BooleanField,
} = foundry.data.fields;

export class WoundData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      value: new NumberField({
        required: true,
        integer: true,
        min: 0,
        initial: 0,
      }),
      treated: new BooleanField(),
      created: new BooleanField(),
      source: new StringField({ default: "wound" }),
    };
  }
}
