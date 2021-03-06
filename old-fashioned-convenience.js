const ConvenientClasses = {
  GHOST_BUTTON: "ghost",
  STRIPED: "striped"
}

const ConvenientForms = {
  ADDRESS_FORM_BUILDER: (address) =>
    new FormEntryGroup("address", address, "Address", new Validator("US addresses require a region (state).",
      (val) => val && !JSON.parse(val).region && JSON.parse(val).country === 'US'
    ))
      .addChildren(
        new TextFormEntry(
          "name",
          address && address.name,
          "Name",
          StringValidators.NOT_EMPTY
        ),
        new TextFormEntry(
          "line1",
          address && address.line1,
          "Street Address",
          StringValidators.NOT_EMPTY
        ),
        new TextFormEntry(
          "city",
          address && address.city,
          "City",
          StringValidators.NOT_EMPTY
        ),
        new TextFormEntry("region", address && address.region, "Region"),
        new TextFormEntry(
          "country",
          address && address.country,
          "Country",
          StringValidators.NOT_EMPTY
        ),
        new TextFormEntry(
          "postalCode",
          address && address.postalCode,
          "Postal Code",
          StringValidators.NOT_EMPTY
        )
      ),

  LOGIN_FORM_BUILDER: (onLoginFunction) =>
    new SubmissionForm(
      "Login",
      (creds) => onLoginFunction(creds),
      "Login"
    ).addChildren(
      new TextFormEntry("username", "", "Username", StringValidators.NOT_EMPTY),
      new PasswordFormEntry(
        "password",
        "",
        "Password",
        StringValidators.NOT_EMPTY
      )
    )
}

const ConvenientContainers = {
  HEADER_CONTAINER_BUILDER: (title, onSignUp, onSignIn, ...classes) => {
    return new Container(
      new BorderLayout(),
      [ConvenientClasses.STRIPED].concat(...classes)
    )
      .add(new Label(title, FontSize.FIRST_HEADER), Position.CENTER)
      .add(
        new Container(new GridLayout(1))
          .add(new Button("Sign Up").addActionListener(onSignUp))
          .add(new Button("Sign In").addActionListener(onSignIn)),
        Position.SOUTH
      );
  },

  ARTICLE_BUILDER: (title, text, ...classes) => {
    return new Container(
      new BorderLayout(),
      [ConvenientClasses.STRIPED].concat(...classes)
    )
      .add(new Label(title, FontSize.SECOND_HEADER), Position.NORTH)
      .add(new LongText(text), Position.CENTER);
  },

  FOOTER_CONTAINER: (companyName, startYear, endYear) => {
    return new Container(new BorderLayout(), ConvenientClasses.STRIPED)
      .add(new Label(companyName), Position.NORTH)
      .add(new Label(startYear + "-" + endYear), Position.CENTER);
  }
}
