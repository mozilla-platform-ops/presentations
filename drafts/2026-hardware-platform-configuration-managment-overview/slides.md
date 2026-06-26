---
theme: default
title: hardware platform configuration managment overview
---

# hardware platform configuration managment overview
Mozilla Release Operations team<br>
https://github.com/mozilla-platform-ops/presentations/

---

# Overview / TLDR / Requested questions index
  - How are they configured? [Slides 3-5](./3)
  - How frequently is the configuration deployed? [Slide 6](./6)
  - How often are they refreshed or reimaged? [Slide 6](./6)
  - What do we enable vs not enable? [Slide 8](./8)
  - If we want to log into a worker with screen sharing is it possible? [Slide 9](./9)
    - What about SSH/Shell?
  - Are the perf workers self-checked regularly? [Slide 10](./10)
  - How much time does it take to deploy a configuration change? [Slides 13-14](./13)

<!--
The last comment block of each slide will be treated as slide notes. It will be visible and editable in Presenter Mode along with the slide. [Read more in the docs](https://sli.dev/guide/syntax.html#notes)
-->

---

# How do we configure our hardware hosts?

- Mac: Puppet (ronin-puppet)
- Linux: Puppet (ronin-puppet)
- Windows: Puppet (ronin-puppet)
- Android:
  - requirements doc for android hardware testing vendors (infrastructure and devices): LINK INCOMING
  - hosts (phones): vendor-managed
    - effort to codify requirements for hosts: JIRA LINK INCOMING
  - execution environment
    - via Dockerfile for Bitbar
    - via shell scripts for LambdaTest

---

# Puppet/OpenVox

- Puppet: define state and then make host match
  - process
    - define the desired host state in Puppet's domain specific language (DSL)
    - run Puppet to make the host match the desired configuration
  - links
    - https://www.puppet.com/
    - https://voxpupuli.org/openvox/
- OpenVox is a free opensource fork of Puppet.
  - Puppet was recently acquired by Perforce and license was changed.
- RelOps' Puppet repository: https://github.com/mozilla-platform-ops/ronin_puppet

---

# Ronin Puppet

- Why `ronin` (masterless) Puppet?
  - Masterless puppet used to be the default.
    - Hosts would check in with coordination server regularly.
  - Masterless is better fit for our fleet management style (and creating cloud VMs).
- Desired state is verified via ServerSpec/InSpec tests.
  - Tests are run at PR merge on VMs, not continuously on production hosts.

---

# How frequently do hosts update their configuration?

- Hosts individually control when they apply the configuration (aka 'converge' on the desired configuration).
  - Mac and Linux: After every TC task/reboot, the host converges in Puppet. Machines are not regularly reimaged.
  - Windows: When a ronin-puppet change is detected, the host is reimaged and the Puppet configuration is applied. Hosts do not converge in between TC task runs.


---

# Roles: How hosts determine their configuration

- Mac: TBD
- Linux: /etc/puppet/role
- Windows: TBD

---

# What is disabled on the hosts?

- Generally:
  - If it's been disabled in the past, we usually will disable it in future platform versions (Ubuntu 22.04 -> 24.04).
  - If someone asks for something to be disabled, we will usually disable it.
- In the past, we've tried to keep systems 'user-like'.
  - We wouldn't fully strip the systems services. We were told more user-like was the goal.
- Going forward, we're open to whatever is desired (e.g. more barebones stripped-down systems and also user-like systems)
  - alternate configurations are additional overhead for us manage/test/update
  - splits pool resources also

---

# Can I get screen sharing or shell access?

- Generally, yes.
  - SSH/Shell: yes
  - Screen sharing/VNC/RDC: yes
- Considerations
  - If you're going to be changing things, we usually want to put the host into a dedicated pool.
  - If you're going to change things, we will usually reimage and redeploy the host when done.
  - We have limited resources (e.g. we can't have 30 loaners in a pool of 100 hosts).
- File a RelOps JIRA ticket for a 'loaner'.
  - See https://mozilla-hub.atlassian.net/wiki/x/AQDvpw.


---

# Are the perf workers self-checked regularly?

- `self-checked`... no.
  - There isn't a process that runs on the hosts that performs checks and removes worker from TC pool.
    - We could get there, but not yet.
    - Should be cautious.
      - e.g. If the entire fleet decides it's not healthy incorrectly, we could end up with no workers.
- We do monitor a bunch of things... see next slides.
- Tell us more about this question.
  - What do you want?

---

# Things we monitor, part 1

## Host metics
- Free disk space
  - Tascluster generic-worker refuses to work below a specified threshold
  - We also have Icinga monitoring. TODO:link
- Performance (CPU)
  - Not yet, but planned. See Fleetbench.  
- TC g-w binary running
  - Checked in Icinga TODO: link

---

# Things we monitor, part 2

## TC worker pool metrics


- TC running worker count
  - Counts are logged in Prometheus and displayed/alerted on in Grafana.
    - Checks for some android pools. Rolling out to other infra.
- TC Queue task counts
  - Counts are logged in Prometheus and displayed/alerted on in Grafana.
    - Currently only on android queues. Rolling out to more soon.


---

# How much time does it take to deploy a configuration change?, part 1

## Mac/Linux Process

- create PR (1 hour, can vary)
- test PR (1 hour, can vary)
  - automated PR testing (1 hour)
  - (optional) manual testing (varies)
- review and merge PR (1 hour)
- deploy PR (1 hour, can vary)
  - pools with fewer tasks can take longer, but next task will always pick up the change.
    - manual Puppet run can be done if absolutely necessary.
- total: optimal case: 4 hours or less

<!--

details/caveats on timing:

- create PR (1 hour, can vary)
- test PR (1 hour, can vary)
- review and merge PR (1 hour)
- deploy PR (1 hour, can vary)
  - low risk: immediately land to master, hosts will pick up change after next reboot/task completion.
  - higher risk:
    - we may roll the change out slowly via override files.
    - we may deploy the change to a test TC worker pool and run larger sets of tests
- total: optimal case: 4 hours or less

-->

---

# How much time does it take to deploy a configuration change?, part 2

## Windows
- TBD

---

# Android

- TBD
  - Bitbar
  - Lambdatest
