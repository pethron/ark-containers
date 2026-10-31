# Reading list: deployment report

Replace each prompt with your own text and keep the headings. Paste real
command output, trimmed to the lines that prove the point.

## Who and what

- Author or pair:
- Compose project name:
- Changed requirement chosen:

## 1. Images you can identify

Which image does each container run, by tag and ID? Which base image did you
choose and why? Which user runs each service? Which files reach the build, and
how did you decide?

## 2. An answer from end to end

The transcript of adding a link and listing it through the web page. What does
the web service's `/health` prove, and what doesn't it?

## 3. Links that survive

Evidence for `down` and `up`, a rebuild, and the replacement of the API
container. Your backup and restore, with the count before and after.

## 4. Only the door you need

Which ports are published, and the evidence that the API can't be reached from
your computer. How the web service finds the API.

## 5. A stack someone else can run

A link to `RUNBOOK.md`. Who tried it, and what you changed after they did.

## 6. The incident

- Symptom, as first observed:
- Possible causes you considered:
- The observation that told them apart:
- Cause:
- Recovery, and why you preferred it to the alternatives:
- What `incident.py reveal` said, and how it compares with your diagnosis:
- The check you added to the runbook:

## 7. The changed requirement

What you changed, the evidence that it works, and the evidence that the earlier
requirements still hold. If you considered another approach, why you didn't
choose it.

## Risks left open and the next question

At least two risks your deployment doesn't address, and what you would
investigate next for each.

## Help received

Hints you used, from the course, a peer or an instructor, and where.
