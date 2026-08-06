# GitHub Pages migration

The site is deployed from `master` by `.github/workflows/deploy-pages.yml`.
Only public website files are copied into the deployment artifact; AWS templates,
Node development files, and repository metadata are not published.

## First deployment

1. In **Settings → Pages → Build and deployment**, select **GitHub Actions** as
   the source.
2. Push the workflow to `master`, or run **Deploy to GitHub Pages** manually.
3. Confirm that the generated `https://clickcaramel.github.io/4spaces/` URL works.
4. In **Settings → Pages → Custom domain**, add `4spaces.company` before changing
   DNS. Keep AWS serving the domain until the GitHub Pages deployment is verified.

## DNS cutover

Replace the apex `A` records for `4spaces.company` with:

```text
185.199.108.153
185.199.109.153
185.199.110.153
185.199.111.153
```

Set `www.4spaces.company` to a `CNAME` record targeting:

```text
clickcaramel.github.io
```

Remove old CloudFront alias records for the apex and `www`. After DNS has
propagated and GitHub has issued the certificate, enable **Enforce HTTPS** in
**Settings → Pages**.

## Verification

```sh
dig +short 4spaces.company A
dig +short www.4spaces.company CNAME
curl -I https://4spaces.company
curl -I https://www.4spaces.company
```

The apex should return the four GitHub Pages IP addresses, `www` should resolve
to `clickcaramel.github.io`, and both HTTPS URLs should serve or redirect to the
configured custom domain.

## Rollback

Restore the previous Route 53 alias records for the CloudFront distribution.
Do not delete the S3 bucket, CloudFront distribution, certificate, or AWS stack
until the GitHub Pages site has been stable for an agreed observation period.
