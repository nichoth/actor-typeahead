# actor-typeahead

An input enhancement that suggests ATProto accounts as the user types a
handle.

## Language

**Actor**:
An ATProto account, as returned by the typeahead search.
_Avoid_: User, account, profile

**Handle**:
The human-readable, domain-style identifier of an Actor.
_Avoid_: Username, name

**Suggestion**:
One Actor offered as a possible completion for the current query.
_Avoid_: Row, result, item, user

**Suggestion list**:
The set of Suggestions shown for the current query, presented beneath
the input.
_Avoid_: Menu, dropdown, results
