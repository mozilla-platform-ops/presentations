---
theme: default
title: hardware platform configuration managment overview
---

# hardware platform configuration managment overview
Mozilla Release Operations team<br>
https://github.com/mozilla-platform-ops/presentations/

---

# Overview / TLDR / Requested questions index
  - How are they configured? [Slides 3-5](/3)
  - How frequently is the configuration deployed? [Slide 6](/6)
  - How often are they refreshed or reimaged? [Slide 6](/6)
  - What do we enable vs not enable? [Slide 8](/8)
  - If we want to log into a worker with screen sharing is it possible? [Slide 9](/9)
    - What about SSH/Shell?
  - Are the perf workers self-checked regularly? [Slide 10](/10)
  - How much time does it take to deploy a configuration change? [Slides 13-14](/13)

<!--
The last comment block of each slide will be treated as slide notes. It will be visible and editable in Presenter Mode along with the slide. [Read more in the docs](https://sli.dev/guide/syntax.html#notes)
-->

---

# How do we configure our hardware hosts?

TLDR: Puppet

- Mac: Puppet (flash OS and then run ronin-puppet)
- Linux: Puppet (flash OS and then run ronin-puppet)
- Windows: Puppet (flash an image created with ronin-puppet)
- Android: it's complicated... see [Slide 15](/15)

---

# Puppet

responsible for host configuration

- Puppet: define state and then make host match
  - process
    - define the desired host state in Puppet's domain specific language (DSL)
    - apply the Puppet configuration to the host (based on role)
      - each role usually corresponds to Taskcluster worker pool
        - for imaging-based workflows, a specific OS and configuration
    - verify configuration via ServerSpec/InSpec tests
      - tests are run at PR merge on GH and Azure VMs, not continuously on production hosts


---

# Ronin Puppet

our (RelOps) Puppet repository

- Why `ronin`?
  - Japanese, relating to a samurai without a lord or master.
    - Puppet used to only work with a central server (master).
  - Masterless puppet is better fit for our fleet management style (and creating cloud images).
    - Hosts specify their role vs a server telling them.
    - For creating cloud images, the tool specifies the role the image should have.


---

# How frequently do hosts update their configuration?

- Hosts control when they apply the configuration.
  - Mac and Linux: After every TC task/reboot, the host converges in Puppet. Machines are not regularly reimaged.
  - Windows: When a ronin-puppet change is detected, the host is reimaged and the Puppet configuration is applied. Hosts do not converge in between TC task runs.
- We can force hosts to update also.


---

# Roles: How hosts determine their configuration

- Mac: /etc/puppet_role
  - 27 roles in ronin_puppet
    - e.g. `gecko_t_osx_1500_m4` -> `releng-hardware/gecko-t-osx-1500-m4`
- Linux: /etc/puppet_role
  - 6 roles in ronin_puppet
    - e.g. `gecko_t_linux_2404_talos` -> `releng-hardware/gecko-t-linux-talos-2404`
- Windows: the PXE server tells hosts their role and serves the appropriate image

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

# Things we monitor

Part 1

## Host metics
- Free disk space
  - Icinga monitoring (https://marlin.mozilla.net/icingaweb2/)
  - Tascluster generic-worker refuses to work below a specified threshold
- TC g-w binary running
  - Icinga monitoring (https://marlin.mozilla.net/icingaweb2/)
- Performance (CPU)
  - Not yet, but planned. See Fleetbench.  

---

# Things we monitor

Part 2

## TC worker pool metrics


- TC running worker count
  - Counts are logged in Prometheus and displayed/alerted on in Grafana.
    - Checks for some android pools. Rolling out to other infra.
- TC Queue task counts
  - Counts are logged in Prometheus and displayed/alerted on in Grafana.
    - Currently only on android queues. Rolling out to more soon.


---

# How much time does it take to deploy a configuration change?

 Mac/Linux Process

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

# How much time does it take to deploy a configuration change?

Windows

TBD

---

# How do we configure our Android phones?

and their Docker environments

  - hosts (phones): mostly vendor-managed but some things can be configured in our startup scripts
    - requirements document: https://docs.google.com/document/d/1H0oQYkxWBrYQTWb5BFIrShrtcm0_VOB-cSInjLPx-tM/edit
      - new requirements continue to be added
  - execution environment (Docker, where the TC client/job runs)
    - via Dockerfile for Bitbar (https://github.com/mozilla-platform-ops/mozilla-bitbar-docker)
    - via shell scripts for LambdaTest (https://github.com/mozilla-platform-ops/mozilla-bitbar-devicepool/tree/master/mozilla_bitbar_devicepool/lambdatest/user_scripts)