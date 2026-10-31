CREATE TABLE books (
    id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    title text NOT NULL CHECK (length(title) BETWEEN 1 AND 200)
);
CREATE TABLE list_revision (
    singleton boolean PRIMARY KEY DEFAULT true CHECK (singleton),
    revision bigint NOT NULL DEFAULT 0
);
INSERT INTO list_revision (singleton) VALUES (true);
