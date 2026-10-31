---
title: "Final project rubric"
track: kata
---

# Final project rubric

The rubric looks at three things for each requirement: whether the result
works, whether you showed the evidence, and whether you can explain the
decision behind it. Wording, formatting and memorized syntax don't count;
an explanation in your own words with the right observation does.

Each criterion has three levels. **Meets** is the target: it describes a
deployment that someone else could take over. **Strong** asks for judgment
beyond the requirement, usually a comparison with an alternative or a check
that rules out a plausible mistake. A criterion at **Not yet** points to what
to fix before handing in, and the chapters listed with it are the place to
start.

| Criterion | Not yet | Meets | Strong |
|-----------|---------|-------|--------|
| **1. Images you can identify** (modules 03, 04) | An image is missing, depends on a source mount, or the report can't say which image a container runs. | Both images build from your Dockerfiles; the report names each running image by tag and ID; the build context leaves out files the service doesn't need. | The report justifies the base image and the user the service runs as, and shows that a code change rebuilds only the steps that depend on it. |
| **2. An answer from end to end** (modules 01, 02) | The page doesn't list or add links, or the evidence is only that the containers are `Up`. | A curl transcript shows a link added and listed through the web service; the report explains that the web `/health` checks only the web process. | The report shows how to tell, from evidence, a web problem from an API problem, and when `Up` and a healthy `/health` can still hide a failure. |
| **3. Links that survive** (module 05) | Links are lost on `down` and `up`, on a rebuild, or on replacement; or no restore was tried. | Links survive all three; a backup was restored into an empty volume and the count matched. | The report explains where the links live, what would happen if they were in the container's writable layer, and how ownership was preserved in the restore. |
| **4. Only the door you need** (module 06) | The API has a published port, or the web page listens beyond loopback. | Only the web service is published, on `127.0.0.1:8080`; the web service reaches the API by name on a network of the project. | The report shows the evidence that the API can't be reached from the host and explains what would change if it had to be. |
| **5. A stack someone else can run** (module 07) | Starting the stack needs steps that aren't in the file or the runbook, or cleanup removes resources outside the project. | One `docker compose up` starts the stack from a fresh copy; the runbook covers start, check, backup, restore and scoped cleanup. | A peer or a fresh clone followed the runbook without help, and the report records what they found unclear and how you fixed it. |
| **6. A diagnosed incident** (modules 02, 05, 06) | The fault was fixed by trial and error, by removing everything, or the links were lost in the recovery. | The report gives the symptom, at least two possible causes, the observation that told them apart, the recovery and why it was chosen; the links survived. | The report explains why a tempting recovery, such as recreating the container, would or wouldn't have worked, and adds a check to the runbook that would detect this fault sooner. |
| **7. A change and its limits** (all modules) | The change is missing, breaks an earlier requirement, or the report lists no open risks. | The changed requirement is met with evidence, and the earlier requirements still hold; the report names at least two risks the deployment leaves open. | The report compares two ways of meeting the change, and the risks come with the next question worth investigating for each. |

## Using the rubric

Read it before you start, and use it again as a checklist before you hand in.
If you needed a hint to get past a step, write it in the report: needing help
is part of learning, and it tells your reviewer which variation to suggest
next. In a pair, the same criteria apply to the shared result, and each person
explains at least one decision and one part of the incident or the change.

A reviewer, whether an instructor or a peer, should run the stack from your
runbook before reading the report. The working result comes first, the
evidence second and the explanation third, and a criterion can't reach
**Meets** on explanation alone.
