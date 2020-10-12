class ConvenientForms {

    static ADDRESS_FORM_BUILDER = (address) =>
        new FormEntryGroup('address', address, 'Address').addChildren(
            new TextFormEntry('name', address && address.name, 'Name', StringValidators.NOT_EMPTY),
            new TextFormEntry('line1', address && address.line1, 'Street Address', StringValidators.NOT_EMPTY),
            new TextFormEntry('city', address && address.city, 'City', StringValidators.NOT_EMPTY),
            new TextFormEntry('region', address && address.region, 'Region'),
            new TextFormEntry('country', address && address.country, 'Country', StringValidators.NOT_EMPTY),
            new TextFormEntry('postalCode', address && address.postalCode, 'Postal Code', StringValidators.NOT_EMPTY)
        );

    static LOGIN_FORM_BUILDER = (onLoginFunction) => new SubmissionForm('Login', (creds) => onLoginFunction(creds), 'Login').addChildren(
        new TextFormEntry('username', '', 'Username', StringValidators.NOT_EMPTY),
        new PasswordFormEntry('password', '', 'Password', StringValidators.NOT_EMPTY)

    )
}