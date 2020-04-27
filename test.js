import chai from 'chai'
import dirtyChai from 'dirty-chai'
import sinon from 'sinon'
import sinonChai from 'sinon-chai'
import jsdomGlobal from 'jsdom-global'
import server from 'nanohtml/lib/server'

const {expect} = chai
chai.use(dirtyChai)
chai.use(sinonChai)
chai.use(dirtyChai)

let serverHtml = (strings, ...values) => {
  // this duplicates the halfcab html function but uses pelo instead of nanohtml
  values = values.map(value => {
    if (value && value.hasOwnProperty('toString')) {
      return value.toString()
    }
    return value
  })

  return server(strings, ...values)
}

let halfcab, ssr, html, defineRoute, gotoRoute, formField, cache, updateState, injectMarkdown, formIsValid,
  css, state, getRouteComponent, nextTick

function intialData (dataInitial) {
  let el = document.createElement('div')
  el.setAttribute('data-initial', dataInitial)
  document.body.appendChild(el)
}

describe('halfcab', () => {

  describe('Server', () => {
    before(async () => {
      jsdomGlobal()
      intialData('eyJjb250YWN0Rm9ybSI6eyJzZW5kRGlzYWJsZWQiOmZhbHNlLCJzaG93VGhhbmtzIjpmYWxzZX0sImxvZ2luIjp7ImRpc2FibGVkIjpmYWxzZX0sImxvYWRpbmciOmZhbHNlLCJzaG93Q29udGFjdCI6dHJ1ZSwicHJvZHVjdHMiOlt7Im5hbWUiOiJTZWVNb25zdGVyIiwicHJvZHVjdFR5cGUiOiJEaWdpdGFsIFNpZ25hZ2UiLCJkZXNjcmlwdGlvbiI6IkRpZ2l0YWwgc2lnbmFnZSBidWlsdCBmb3Igc2tpIGFyZWFzLiIsInByaWNlIjoiJDMsMjAwIFVTRCBwZXIgd2ludGVyIiwibG9nbyI6eyJ1cmwiOiIvL2ltYWdlcy5jb250ZW50ZnVsLmNvbS82cDhvaHhmaWthazEvNmdaY1A2NG1UbTIybTAyWWFvTUdPUS9kN2ZlZjkwZWVhZjI5MmQwNDcwYzNiNjlhODJiMmM2NS9zZWVtb25zdGVyLnN2ZyIsIm5hbWUiOiJTZWVNb25zdGVyIExvZ28ifSwiZGV0YWlsU2VjdGlvbnMiOlt7Im5hbWUiOiJXaGF0IGlzIFNlZU1vbnN0ZXIiLCJkZXNjcmlwdGlvbiI6IiMjIyBTZWVNb25zdGVyIGVuYWJsZXMgeW91IHRvIGRpc3BsYXkgZHluYW1pYyBtZXNzYWdlcyBvbiBzY3JlZW5zIGFyb3VuZCB5b3VyIHNraSBhcmVhIGFuZCBvbiBob3RlbCByb29tIFRWcywgYWxsIG1hbmFnZWQgb3ZlciB0aGUgSW50ZXJuZXQuIiwibGlzdCI6IiIsIm1lZGlhIjp7ImZpbGUiOiIvL2ltYWdlcy5jb250ZW50ZnVsLmNvbS82cDhvaHhmaWthazEvYmZtQU5QdE1mUUNRdVE0UWthV1VFLzI0OTY0MjU3OGJmYTBlYzE3M2JlMzhjYTkzMjRhYTEzL3NlZW1vbnN0ZXItMS0yLTMucG5nIiwid2lkdGgiOjg2Nn0sImxpbmsiOiIifSx7Im5hbWUiOiJTZWVNb25zdGVyIEluY2x1ZGVzIiwiZGVzY3JpcHRpb24iOiIiLCJsaXN0IjpbIlBsYXlzIG9uIGFueSBjb21wdXRlciAmIFRWIGNvbWJvIiwiQmFuZHdpZHRoLCBzdG9yYWdlICYgc3VwcG9ydCBpbmNsdWRlZCIsIkVhc3kgZHJhZyBhbmQgZHJvcCBhZG1pbi4iLCJCdWlsdCBpbiBhbmltYXRpb24uIiwiVXBsb2FkIGltYWdlcyBhbmQgdmlkZW8gaW4gYW55IGZvcm1hdCIsIlVzZSB3aXRoIGJvdGggZGlnaXRhbCBzaWducyBhbmQgaW4tcm9vbSBUViBzeXN0ZW1zIiwiVXNlIGxpdmUgZGF0YSB0byBwb3B1bGF0ZSB0ZXh0IGZpZWxkcyAmIHN3YXAgb3V0IGltYWdlcyIsIlJlbW90ZWx5IGNvbnRyb2wgeW91ciBzY3JlZW5zIiwiU2NoZWR1bGUgY29udGVudCIsIlNvY2lhbCBtZWRpYSBmZWVkcyIsIkRpc3BsYXkgdmlkZW9zIGFuZCBwaG90b3MiLCJNYXBzLCBsaWZ0ICYgdHJhaWwgc3RhdHVzIl0sIm1lZGlhIjp7ImZpbGUiOiIvL2ltYWdlcy5jb250ZW50ZnVsLmNvbS82cDhvaHhmaWthazEvM3kwQWFQUE16Q0dLaXVLY011ZWEyUS9mNTJiNTc5ZGM5YTIwODBlNDg0OWVlODcyMjYxMjRjMi9RVC13ZWF0aGVyZm9yZWNhc3Qtc2NyZWVuLmpwZyIsIndpZHRoIjo2Njd9LCJsaW5rIjoiIn1dfSx7Im5hbWUiOiJ2aWNvTWFwIiwicHJvZHVjdFR5cGUiOiJJbnRlcmFjdGl2ZSBUcmFpbCBNYXAiLCJkZXNjcmlwdGlvbiI6IipUaGUqIGludGVyYWN0aXZlIG1hcCBmb3Igc2tpIGFyZWFzLiIsInByaWNlIjoiJDIsODAwIFVTRCBwZXIgd2ludGVyIiwibG9nbyI6eyJ1cmwiOiIvL2ltYWdlcy5jb250ZW50ZnVsLmNvbS82cDhvaHhmaWthazEvMXNDOU4xV0hXODJBV2tvZUljS1FZMi82ODhjYmI5NmU3YmU2MDJkZDFmOWJmYmFmZjI0ZTI5MC92aWNvbWFwLnN2ZyIsIm5hbWUiOiJ2aWNvTWFwIExvZ28ifSwiZGV0YWlsU2VjdGlvbnMiOlt7Im5hbWUiOiJEZW1vIiwiZGVzY3JpcHRpb24iOiIqVGhlIGJlc3Qgd2F5IHRvIGNoZWNrIG91dCB2aWNvTWFwLCBpcyB0byBqdXN0IHN0YXJ0IHVzaW5nIGl0ISBIYXZlIGEgZ28gd2l0aCB0aGlzIG9uZSBhbmQgbGV0IHVzIGtub3cgd2hhdCB5b3UgdGhpbmsuKiIsImxpc3QiOiIiLCJtZWRpYSI6IiIsImxpbmsiOiJodHRwczovL3ZpY29tYXAtY2RuLnJlc29ydHMtaW50ZXJhY3RpdmUuY29tL21hcC8xMiJ9LHsibmFtZSI6InZpY29NYXAgaW5jbHVkZXMiLCJkZXNjcmlwdGlvbiI6IiIsImxpc3QiOlsiUmVzcG9uc2l2ZSAod29ya3Mgb24gZGVza3RvcCBhbmQgbW9iaWxlIGRldmljZXMpIiwiTGl2ZSBsaWZ0IGFuZCB0cmFpbCBkYXRhIChmcmVlIGJhc2ljIFJlcG9ydCBQYWwgY29ubmVjdG9yIGluY2x1ZGVkKSIsIkNsb3VkIGhvc3RlZCAoQVdTKSIsIkJhbmR3aWR0aCwgc3RvcmFnZSAmIHN1cHBvcnQgaW5jbHVkZWQiLCJFYXN5IHdlYnNpdGUgZW1iZWQiLCJObyBzZXR1cCBjb3N0IC0gYnVpbHQgZnJvbSB5b3VyIGV4aXN0aW5nIElsbHVzdHJhdG9yIGZpbGUiXSwibWVkaWEiOiIiLCJsaW5rIjoiIn1dfSx7Im5hbWUiOiJSZXBvcnQgUGFsIiwicHJvZHVjdFR5cGUiOiJTbm93IFJlcG9ydGluZyIsImRlc2NyaXB0aW9uIjoiRWFzeSBzbm93IHJlcG9ydGluZyBpbiB0aGUgY2xvdWQuIiwicHJpY2UiOiIkMywwMDAgVVNEIHBlciB3aW50ZXIiLCJsb2dvIjp7InVybCI6Ii8vaW1hZ2VzLmNvbnRlbnRmdWwuY29tLzZwOG9oeGZpa2FrMS82SnBwR2RBV3pLYzhtTThzbUU4dzhtL2FlNWE1ZDQzOTI4MDI3ODY5ZjMyNGFhYTQ2YjZmOTY4L3JlcG9ydHBhbC5zdmciLCJuYW1lIjoiUmVwb3J0IFBhbCBMb2dvIn0sImRldGFpbFNlY3Rpb25zIjpbeyJuYW1lIjoiUmVwb3J0IFBhbCBTdW1tYXJ5IiwiZGVzY3JpcHRpb24iOiJUaGUgaWRlYSBiZWhpbmQgUmVwb3J0IHBhbCBpcyBhIHNpbXBsZSBvbmUgLSBtb3ZlIHNub3cgcmVwb3J0aW5nIGF3YXkgZnJvbSB5b3VyIHdlYnNpdGUgQ01TIGFuZCBpbnRvIHRoZSBjbG91ZC5cblxuSW5zdGVhZCBvZiBjb250cm9sbGluZyB5b3VyIHNub3cgcmVwb3J0IGZyb20geW91ciB3ZWJzaXRlICh3aGljaCBjYW4gY2hhbmdlIGV2ZXJ5IGNvdXBsZSBvZiB5ZWFycywgcmVzdWx0aW5nIGluIG1vcmUgY29zdHMgdG8gYnVpbGQsIHRpbWUgcmUtdHJhaW5pbmcgc3RhZmYgYW5kIGhhdmluZyB0byByZS1pbnRlZ3JhdGUgd2l0aCAzcmQgcGFydGllcyksIG1vdmUgaXQgaW50byB0aGUgY2xvdWQgYW5kIGhhdmUgYSBjb25zaXN0ZW50IHBsYXRmb3JtLCBzZWFzb24gYWZ0ZXIgc2Vhc29uLlxuXG5SZXBvcnQgUGFsIG1ha2VzIHVzZSBvZiB0aGUgbGF0ZXN0IHRlY2hub2xvZ2llcyBvbiBvZmZlciBmcm9tIEFtYXpvbiBXZWIgU2VydmljZXMsIGdpdmluZyB5b3UgYSByb2NrIHNvbGlkLCBhbHdheXMgb24gc25vdyByZXBvcnRpbmcgcGxhdGZvcm0gdGhhdCdzIGxpZ2h0bmluZyBmYXN0LlxuXG5FdmVyeSBza2kgcmVzb3J0IGlzIGRpZmZlcmVudCwgc28gUmVwb3J0IFBhbCBoYXMgYmVlbiBidWlsdCBmcm9tIHRoZSBncm91bmQgdXAgc28gdGhhdCB3ZSBjYW4gY3VzdG9taXNlIGl0IHRvIHN1aXQgeW91LiBObyBtb3JlIHdvcmtpbmcgeW91ciB3YXkgYXJvdW5kIGxpbWl0YXRpb25zIG9mIHlvdXIgd2Vic2l0ZSBDTVMsIHlvdSBjYW4gaW5wdXQgYW5kIG91dHB1dCB3aGF0IHlvdSBsaWtlLlxuXG5XZSdsbCBzZXR1cCB5b3VyIG91dHB1dCBpbiBbTVROLlhNTF0oaHR0cDovL210bnhtbC5vcmcgXCJNVE4uWE1MXCIpIGZvcm1hdCAtIHRoZSBpbmR1c3RyeSBzdGFuZGFyZC4gWW91ciBkYXRhIHdpbGwgYmUgZWFzaWx5IHNoYXJlZCB3aXRoIDNyZCBwYXJ0aWVzLiIsImxpc3QiOiIiLCJtZWRpYSI6eyJmaWxlIjoiLy9pbWFnZXMuY29udGVudGZ1bC5jb20vNnA4b2h4ZmlrYWsxLzFaUHlDVFhjMDh3NlU4Z0MyazZTZ20vNmI1YjJhNzczOTVlYzE5NjVlMDI0NmJmOGJlOGU3NGEvU2NyZWVuLVNob3QtMjAxNi0xMi0xMS1hdC00LjE4LjM0LXBtLnBuZyIsIndpZHRoIjozODV9LCJsaW5rIjoiIn0seyJuYW1lIjoiUmVwb3J0IFBhbCBJbmNsdWRlcyIsImRlc2NyaXB0aW9uIjoiIiwibGlzdCI6WyJVbmxpbWl0ZWQgdXNlcnMiLCJJbnRlbGxpZ2VudCByZXBvcnQgbWVyZ2luZyIsIlNjaGVkdWxlZCByZXBvcnRzIiwiU29jaWFsIG1lZGlhIGludGVncmF0aW9uIiwiTVROLlhNTCBvdXRwdXQiLCJSZXBvcnQgaGlzdG9yeSBhbmQgcm9sbGJhY2siLCJBdXRvbWF0ZWQgbGlmdCAmIHRyYWlsIG9wZW4gY291bnRzLCBhY3JlYWdlIGFuZCBsZW5ndGgiLCJSb2NrIHNvbGlkIC0gY2xvdWQgaG9zdGVkIG9uIEFtYXpvbiBXZWIgU2VydmljZXMiXSwibWVkaWEiOiIiLCJsaW5rIjoiIn1dfV0sImNvbXBhbnkiOnsibmFtZSI6IlJlc29ydHMgSW50ZXJhY3RpdmUiLCJkZXNjcmlwdGlvbiI6IlJlc29ydHMgSW50ZXJhY3RpdmUgaGFzIGJlZW4gbWFraW5nIGNsb3VkIHNvZnR3YXJlIGZvciB0aGUgc2tpIGluZHVzdHJ5IGZvciBzaW5jZSAyMDA0LiBUaGUgd2F5IG91ciBzb2Z0d2FyZSBpcyBidWlsdCBhbGxvd3MgdXMgdG8gZXZvbHZlIG92ZXIgdGltZSBhbmQgZW1icmFjZSBjaGFuZ2luZyB0ZWNobm9sb2dpZXMg4oCTIGEgbXVzdCBoYXZlIHF1YWxpdHkgb2YgYW55IGNsb3VkIGJhc2VkIHBhcnRuZXIuIE91ciBjdXJyZW50IHN1aXRlIG9mIFJlcG9ydCBQYWwsIHZpY29NYXAgYW5kIFNlZU1vbnN0ZXIgY292ZXJzIGEgYnJvYWQgcmFuZ2Ugb2Ygc2tpIGFyZWEgbWFya2V0aW5nIGFuZCBvcGVyYXRpb25zIGFuZCBhbGxvd3MgeW91IHRvIGdldCBiYWNrIHRvIHdoYXTigJlzIGltcG9ydGFudCAobGlrZSB0YWtpbmcgYSBmZXcgcnVucyBvbiB5b3VyIGx1bmNoIGJyZWFrISkgR2V0IGluIHRvdWNoIHRvZGF5LCB3ZeKAmWQgbG92ZSB0byB0YWxrLiIsImxvZ28iOnsidXJsIjoiLy9pbWFnZXMuY29udGVudGZ1bC5jb20vNnA4b2h4ZmlrYWsxLzZydjJ0QnBZNXlpRVVveUlDdTBBNFcvNGFiOTE1MTM0MzY4Nzg5YzEzNDNjMzQ0NDAwNWUzYWEvcmVzb3J0c2ludGVyYWN0aXZlLnN2ZyIsIm5hbWUiOiJSZXNvcnRzIEludGVyYWN0aXZlIExvZ28ifSwiY29tcGFueURldGFpbFNlY3Rpb25zIjpbeyJpbWFnZSI6Ii8vaW1hZ2VzLmNvbnRlbnRmdWwuY29tLzZwOG9oeGZpa2FrMS82SW1WemxCWFNFaUtTZWVxZ0VRa3NnL2M3NDhhZjU3NDkxZjc4MDQ4NDUwMzhiNGM2YTE3N2E4L3Bvd2Rlcl9zaG90LmpwZyIsInRpdGxlIjoiUmVzb3J0cyBJbnRlcmFjdGl2ZSB3ZWJzaXRlIiwiYm9keSI6IiJ9LHsiaW1hZ2UiOiIvL2ltYWdlcy5jb250ZW50ZnVsLmNvbS82cDhvaHhmaWthazEvM3kwQWFQUE16Q0dLaXVLY011ZWEyUS9mNTJiNTc5ZGM5YTIwODBlNDg0OWVlODcyMjYxMjRjMi9RVC13ZWF0aGVyZm9yZWNhc3Qtc2NyZWVuLmpwZyIsInRpdGxlIjoiV2hhdCBzZXRzIHVzIGFwYXJ0PyIsImJvZHkiOiJSZXNvcnRzIEludGVyYWN0aXZlIGhhcyBiZWVuIG1ha2luZyBjbG91ZCBzb2Z0d2FyZSBmb3IgdGhlIHNraSBpbmR1c3RyeSBzaW5jZSAyMDA1IHNvIHdlIGtub3cgYSB0aGluZyBvciB0d28gYWJvdXQgdGhlIHN1YmplY3QhIFRoZSB3YXkgb3VyIHNvZnR3YXJlIGlzIGJ1aWx0IGFsbG93cyB1cyB0byBldm9sdmUgb3ZlciB0aW1lIGFuZCBlbWJyYWNlIGNoYW5naW5nIHRlY2hub2xvZ2llcyDigJMgYSBtdXN0IGhhdmUgcXVhbGl0eSBvZiBhbnkgY2xvdWQgYmFzZWQgcGFydG5lci4gT3VyIGN1cnJlbnQgc3VpdGUgb2YgUmVwb3J0IFBhbCwgdmljb01hcCBhbmQgU2VlTW9uc3RlciBjb3ZlcnMgYSBicm9hZCByYW5nZSBvZiBza2kgYXJlYSBtYXJrZXRpbmcgYW5kIG9wZXJhdGlvbnMgYW5kIGFsbG93cyB5b3UgdG8gZ2V0IGJhY2sgdG8gd2hhdOKAmXMgaW1wb3J0YW50IChsaWtlIHRha2luZyBhIGZldyBydW5zIG9uIHlvdXIgbHVuY2ggYnJlYWshKSBbR2V0IGluIHRvdWNoIHRvZGF5LCB3ZeKAmWQgbG92ZSB0byB0YWxrLl0obWFpbHRvOmluZm9AcmVzb3J0cy1pbnRlcmFjdGl2ZS5jb20pIn0seyJpbWFnZSI6Ii8vaW1hZ2VzLmNvbnRlbnRmdWwuY29tLzZwOG9oeGZpa2FrMS80ZVJ3ZDkyZ293b21NS0FZT2dnY3cwLzlmODNjMmYyYjJhN2VhZWIxMzJhOWRmZTYwNTA5YmNhL0RldmljZXMuanBnIiwidGl0bGUiOiJDbGV2ZXIgU29mdHdhcmUgTWFraW5nIExpZmUgRWFzeSIsImJvZHkiOiItIFlvdSB3b3JrIGluIHRoZSBza2kgaW5kdXN0cnkgYmVjYXVzZSB5b3UgbG92ZSBpdCwgc28gd2UgYnVpbGQgc29mdHdhcmUgdG8gc2F2ZSB5b3UgdGltZSBhbmQgZ2V0IHlvdSBiYWNrIG9uIHRoZSBoaWxsXG4tIENsb3VkIGJhc2VkIHNvZnR3YXJlIGlzIGRlc2lnbmVkIHRvIGJlIHVzZWQgYW55d2hlcmUg4oCTIGRlc2t0b3AsIG1vYmlsZSwgQ29sb3JhZG8sIFRpbWJ1a3R1LiBJZiB5b3UgY2FuIGdldCBhbiBJbnRlcm5ldCBjb25uZWN0aW9uLCB3ZeKAmXZlIGdvdCB5b3UgY292ZXJlZFxuLSBTaW1wbGljaXR5IGFuZCBzdGFiaWxpdHkgZm9ybSBhIGNvcmUgcGFydCBvZiBvdXIgc29mdHdhcmUgYXJjaGl0ZWN0dXJlLiBPdXIgcHJvZHVjdHMgYXJlIGhvc3RlZCBvbiBBbWF6b24gV2ViIFNlcnZpY2VzIGFuZCBtYWtlIHVzZSBvZiB0aGVpciBiZXN0IGFuZCBsYXRlc3QgdGVjaG5vbG9naWVzIGxpa2UgQ2xvdWRGcm9udCwgQXVyb3JhLCBhbmQgRWxhc3RpYyBCZWFuc3RhbGsgdG8gbWFrZSBzdXJlIHdl4oCZcmUgYWx3YXlzIGZhc3QgYW5kIGF2YWlsYWJsZVxuLSBJbmNsdWRlIGxpdmUgZGF0YSBhbmQgaW1hZ2VzIGZyb20gc29jaWFsIG1lZGlhLCB3ZWF0aGVyLCBuZXdzIGFuZCBvdGhlciB3ZWJzaXRlc1xuLSBVcGxvYWQgdmlkZW8gaW4gYW55IGZvcm1hdCBhbmQgaXTigJlsbCBiZSBjb252ZXJ0ZWQgZm9yIHlvdSJ9XSwiaWNvbiI6eyJzeXMiOnsic3BhY2UiOnsic3lzIjp7InR5cGUiOiJMaW5rIiwibGlua1R5cGUiOiJTcGFjZSIsImlkIjoiNnA4b2h4ZmlrYWsxIn19LCJpZCI6ImttRzBYM2ZGUWNFc2VpbWNlVWtJcyIsInR5cGUiOiJBc3NldCIsImNyZWF0ZWRBdCI6IjIwMTctMDYtMThUMTA6MjQ6NTQuNTgwWiIsInVwZGF0ZWRBdCI6IjIwMTctMDYtMThUMTA6MjQ6NTQuNTgwWiIsInJldmlzaW9uIjoxLCJsb2NhbGUiOiJlbi1OWiJ9LCJmaWVsZHMiOnsidGl0bGUiOiJTZW1pLWZsYWtlLXBuZyIsImRlc2NyaXB0aW9uIjoiUE5HIHZlcnNpb24gb2Ygc2VtaS1mbGFrZSIsImZpbGUiOnsidXJsIjoiLy9pbWFnZXMuY29udGVudGZ1bC5jb20vNnA4b2h4ZmlrYWsxL2ttRzBYM2ZGUWNFc2VpbWNlVWtJcy85NDNjMDQ3OTFhMmQ0NDJmMWY1MDgwMmEzODY4ZTI5ZS9zZW1pZmxha2UucG5nIiwiZGV0YWlscyI6eyJzaXplIjoyNDE5MCwiaW1hZ2UiOnsid2lkdGgiOjUxMiwiaGVpZ2h0Ijo1MTJ9fSwiZmlsZU5hbWUiOiJzZW1pZmxha2UucG5nIiwiY29udGVudFR5cGUiOiJpbWFnZS9wbmcifX19fX0=')
      let halfcabModule = await import('./halfcab')
      ;({
        ssr,
        html,
        defineRoute,
        gotoRoute,
        formField,
        cache,
        updateState,
        injectMarkdown,
        formIsValid,
        css,
        getRouteComponent,
        nextTick
      } = halfcabModule)
      halfcab = halfcabModule.default
    })
    it('Produces a string when doing SSR', () => {
      let style = css`
        .myStyle {
          width: 100px;
        }
      `
      let {componentsString, stylesString} = ssr(serverHtml`
        <div class="${style.myStyle}" oninput=${() => {
      }}></div>
      `)
      expect(typeof componentsString === 'string').to.be.true()
    })
  })

  describe('Client', () => {

    before(async () => {
      jsdomGlobal()
      intialData('eyJjb250YWN0Rm9ybSI6eyJzZW5kRGlzYWJsZWQiOmZhbHNlLCJzaG93VGhhbmtzIjpmYWxzZX0sImxvZ2luIjp7ImRpc2FibGVkIjpmYWxzZX0sImxvYWRpbmciOmZhbHNlLCJzaG93Q29udGFjdCI6dHJ1ZSwicHJvZHVjdHMiOlt7Im5hbWUiOiJTZWVNb25zdGVyIiwicHJvZHVjdFR5cGUiOiJEaWdpdGFsIFNpZ25hZ2UiLCJkZXNjcmlwdGlvbiI6IkRpZ2l0YWwgc2lnbmFnZSBidWlsdCBmb3Igc2tpIGFyZWFzLiIsInByaWNlIjoiJDMsMjAwIFVTRCBwZXIgd2ludGVyIiwibG9nbyI6eyJ1cmwiOiIvL2ltYWdlcy5jb250ZW50ZnVsLmNvbS82cDhvaHhmaWthazEvNmdaY1A2NG1UbTIybTAyWWFvTUdPUS9kN2ZlZjkwZWVhZjI5MmQwNDcwYzNiNjlhODJiMmM2NS9zZWVtb25zdGVyLnN2ZyIsIm5hbWUiOiJTZWVNb25zdGVyIExvZ28ifSwiZGV0YWlsU2VjdGlvbnMiOlt7Im5hbWUiOiJXaGF0IGlzIFNlZU1vbnN0ZXIiLCJkZXNjcmlwdGlvbiI6IiMjIyBTZWVNb25zdGVyIGVuYWJsZXMgeW91IHRvIGRpc3BsYXkgZHluYW1pYyBtZXNzYWdlcyBvbiBzY3JlZW5zIGFyb3VuZCB5b3VyIHNraSBhcmVhIGFuZCBvbiBob3RlbCByb29tIFRWcywgYWxsIG1hbmFnZWQgb3ZlciB0aGUgSW50ZXJuZXQuIiwibGlzdCI6IiIsIm1lZGlhIjp7ImZpbGUiOiIvL2ltYWdlcy5jb250ZW50ZnVsLmNvbS82cDhvaHhmaWthazEvYmZtQU5QdE1mUUNRdVE0UWthV1VFLzI0OTY0MjU3OGJmYTBlYzE3M2JlMzhjYTkzMjRhYTEzL3NlZW1vbnN0ZXItMS0yLTMucG5nIiwid2lkdGgiOjg2Nn0sImxpbmsiOiIifSx7Im5hbWUiOiJTZWVNb25zdGVyIEluY2x1ZGVzIiwiZGVzY3JpcHRpb24iOiIiLCJsaXN0IjpbIlBsYXlzIG9uIGFueSBjb21wdXRlciAmIFRWIGNvbWJvIiwiQmFuZHdpZHRoLCBzdG9yYWdlICYgc3VwcG9ydCBpbmNsdWRlZCIsIkVhc3kgZHJhZyBhbmQgZHJvcCBhZG1pbi4iLCJCdWlsdCBpbiBhbmltYXRpb24uIiwiVXBsb2FkIGltYWdlcyBhbmQgdmlkZW8gaW4gYW55IGZvcm1hdCIsIlVzZSB3aXRoIGJvdGggZGlnaXRhbCBzaWducyBhbmQgaW4tcm9vbSBUViBzeXN0ZW1zIiwiVXNlIGxpdmUgZGF0YSB0byBwb3B1bGF0ZSB0ZXh0IGZpZWxkcyAmIHN3YXAgb3V0IGltYWdlcyIsIlJlbW90ZWx5IGNvbnRyb2wgeW91ciBzY3JlZW5zIiwiU2NoZWR1bGUgY29udGVudCIsIlNvY2lhbCBtZWRpYSBmZWVkcyIsIkRpc3BsYXkgdmlkZW9zIGFuZCBwaG90b3MiLCJNYXBzLCBsaWZ0ICYgdHJhaWwgc3RhdHVzIl0sIm1lZGlhIjp7ImZpbGUiOiIvL2ltYWdlcy5jb250ZW50ZnVsLmNvbS82cDhvaHhmaWthazEvM3kwQWFQUE16Q0dLaXVLY011ZWEyUS9mNTJiNTc5ZGM5YTIwODBlNDg0OWVlODcyMjYxMjRjMi9RVC13ZWF0aGVyZm9yZWNhc3Qtc2NyZWVuLmpwZyIsIndpZHRoIjo2Njd9LCJsaW5rIjoiIn1dfSx7Im5hbWUiOiJ2aWNvTWFwIiwicHJvZHVjdFR5cGUiOiJJbnRlcmFjdGl2ZSBUcmFpbCBNYXAiLCJkZXNjcmlwdGlvbiI6IipUaGUqIGludGVyYWN0aXZlIG1hcCBmb3Igc2tpIGFyZWFzLiIsInByaWNlIjoiJDIsODAwIFVTRCBwZXIgd2ludGVyIiwibG9nbyI6eyJ1cmwiOiIvL2ltYWdlcy5jb250ZW50ZnVsLmNvbS82cDhvaHhmaWthazEvMXNDOU4xV0hXODJBV2tvZUljS1FZMi82ODhjYmI5NmU3YmU2MDJkZDFmOWJmYmFmZjI0ZTI5MC92aWNvbWFwLnN2ZyIsIm5hbWUiOiJ2aWNvTWFwIExvZ28ifSwiZGV0YWlsU2VjdGlvbnMiOlt7Im5hbWUiOiJEZW1vIiwiZGVzY3JpcHRpb24iOiIqVGhlIGJlc3Qgd2F5IHRvIGNoZWNrIG91dCB2aWNvTWFwLCBpcyB0byBqdXN0IHN0YXJ0IHVzaW5nIGl0ISBIYXZlIGEgZ28gd2l0aCB0aGlzIG9uZSBhbmQgbGV0IHVzIGtub3cgd2hhdCB5b3UgdGhpbmsuKiIsImxpc3QiOiIiLCJtZWRpYSI6IiIsImxpbmsiOiJodHRwczovL3ZpY29tYXAtY2RuLnJlc29ydHMtaW50ZXJhY3RpdmUuY29tL21hcC8xMiJ9LHsibmFtZSI6InZpY29NYXAgaW5jbHVkZXMiLCJkZXNjcmlwdGlvbiI6IiIsImxpc3QiOlsiUmVzcG9uc2l2ZSAod29ya3Mgb24gZGVza3RvcCBhbmQgbW9iaWxlIGRldmljZXMpIiwiTGl2ZSBsaWZ0IGFuZCB0cmFpbCBkYXRhIChmcmVlIGJhc2ljIFJlcG9ydCBQYWwgY29ubmVjdG9yIGluY2x1ZGVkKSIsIkNsb3VkIGhvc3RlZCAoQVdTKSIsIkJhbmR3aWR0aCwgc3RvcmFnZSAmIHN1cHBvcnQgaW5jbHVkZWQiLCJFYXN5IHdlYnNpdGUgZW1iZWQiLCJObyBzZXR1cCBjb3N0IC0gYnVpbHQgZnJvbSB5b3VyIGV4aXN0aW5nIElsbHVzdHJhdG9yIGZpbGUiXSwibWVkaWEiOiIiLCJsaW5rIjoiIn1dfSx7Im5hbWUiOiJSZXBvcnQgUGFsIiwicHJvZHVjdFR5cGUiOiJTbm93IFJlcG9ydGluZyIsImRlc2NyaXB0aW9uIjoiRWFzeSBzbm93IHJlcG9ydGluZyBpbiB0aGUgY2xvdWQuIiwicHJpY2UiOiIkMywwMDAgVVNEIHBlciB3aW50ZXIiLCJsb2dvIjp7InVybCI6Ii8vaW1hZ2VzLmNvbnRlbnRmdWwuY29tLzZwOG9oeGZpa2FrMS82SnBwR2RBV3pLYzhtTThzbUU4dzhtL2FlNWE1ZDQzOTI4MDI3ODY5ZjMyNGFhYTQ2YjZmOTY4L3JlcG9ydHBhbC5zdmciLCJuYW1lIjoiUmVwb3J0IFBhbCBMb2dvIn0sImRldGFpbFNlY3Rpb25zIjpbeyJuYW1lIjoiUmVwb3J0IFBhbCBTdW1tYXJ5IiwiZGVzY3JpcHRpb24iOiJUaGUgaWRlYSBiZWhpbmQgUmVwb3J0IHBhbCBpcyBhIHNpbXBsZSBvbmUgLSBtb3ZlIHNub3cgcmVwb3J0aW5nIGF3YXkgZnJvbSB5b3VyIHdlYnNpdGUgQ01TIGFuZCBpbnRvIHRoZSBjbG91ZC5cblxuSW5zdGVhZCBvZiBjb250cm9sbGluZyB5b3VyIHNub3cgcmVwb3J0IGZyb20geW91ciB3ZWJzaXRlICh3aGljaCBjYW4gY2hhbmdlIGV2ZXJ5IGNvdXBsZSBvZiB5ZWFycywgcmVzdWx0aW5nIGluIG1vcmUgY29zdHMgdG8gYnVpbGQsIHRpbWUgcmUtdHJhaW5pbmcgc3RhZmYgYW5kIGhhdmluZyB0byByZS1pbnRlZ3JhdGUgd2l0aCAzcmQgcGFydGllcyksIG1vdmUgaXQgaW50byB0aGUgY2xvdWQgYW5kIGhhdmUgYSBjb25zaXN0ZW50IHBsYXRmb3JtLCBzZWFzb24gYWZ0ZXIgc2Vhc29uLlxuXG5SZXBvcnQgUGFsIG1ha2VzIHVzZSBvZiB0aGUgbGF0ZXN0IHRlY2hub2xvZ2llcyBvbiBvZmZlciBmcm9tIEFtYXpvbiBXZWIgU2VydmljZXMsIGdpdmluZyB5b3UgYSByb2NrIHNvbGlkLCBhbHdheXMgb24gc25vdyByZXBvcnRpbmcgcGxhdGZvcm0gdGhhdCdzIGxpZ2h0bmluZyBmYXN0LlxuXG5FdmVyeSBza2kgcmVzb3J0IGlzIGRpZmZlcmVudCwgc28gUmVwb3J0IFBhbCBoYXMgYmVlbiBidWlsdCBmcm9tIHRoZSBncm91bmQgdXAgc28gdGhhdCB3ZSBjYW4gY3VzdG9taXNlIGl0IHRvIHN1aXQgeW91LiBObyBtb3JlIHdvcmtpbmcgeW91ciB3YXkgYXJvdW5kIGxpbWl0YXRpb25zIG9mIHlvdXIgd2Vic2l0ZSBDTVMsIHlvdSBjYW4gaW5wdXQgYW5kIG91dHB1dCB3aGF0IHlvdSBsaWtlLlxuXG5XZSdsbCBzZXR1cCB5b3VyIG91dHB1dCBpbiBbTVROLlhNTF0oaHR0cDovL210bnhtbC5vcmcgXCJNVE4uWE1MXCIpIGZvcm1hdCAtIHRoZSBpbmR1c3RyeSBzdGFuZGFyZC4gWW91ciBkYXRhIHdpbGwgYmUgZWFzaWx5IHNoYXJlZCB3aXRoIDNyZCBwYXJ0aWVzLiIsImxpc3QiOiIiLCJtZWRpYSI6eyJmaWxlIjoiLy9pbWFnZXMuY29udGVudGZ1bC5jb20vNnA4b2h4ZmlrYWsxLzFaUHlDVFhjMDh3NlU4Z0MyazZTZ20vNmI1YjJhNzczOTVlYzE5NjVlMDI0NmJmOGJlOGU3NGEvU2NyZWVuLVNob3QtMjAxNi0xMi0xMS1hdC00LjE4LjM0LXBtLnBuZyIsIndpZHRoIjozODV9LCJsaW5rIjoiIn0seyJuYW1lIjoiUmVwb3J0IFBhbCBJbmNsdWRlcyIsImRlc2NyaXB0aW9uIjoiIiwibGlzdCI6WyJVbmxpbWl0ZWQgdXNlcnMiLCJJbnRlbGxpZ2VudCByZXBvcnQgbWVyZ2luZyIsIlNjaGVkdWxlZCByZXBvcnRzIiwiU29jaWFsIG1lZGlhIGludGVncmF0aW9uIiwiTVROLlhNTCBvdXRwdXQiLCJSZXBvcnQgaGlzdG9yeSBhbmQgcm9sbGJhY2siLCJBdXRvbWF0ZWQgbGlmdCAmIHRyYWlsIG9wZW4gY291bnRzLCBhY3JlYWdlIGFuZCBsZW5ndGgiLCJSb2NrIHNvbGlkIC0gY2xvdWQgaG9zdGVkIG9uIEFtYXpvbiBXZWIgU2VydmljZXMiXSwibWVkaWEiOiIiLCJsaW5rIjoiIn1dfV0sImNvbXBhbnkiOnsibmFtZSI6IlJlc29ydHMgSW50ZXJhY3RpdmUiLCJkZXNjcmlwdGlvbiI6IlJlc29ydHMgSW50ZXJhY3RpdmUgaGFzIGJlZW4gbWFraW5nIGNsb3VkIHNvZnR3YXJlIGZvciB0aGUgc2tpIGluZHVzdHJ5IGZvciBzaW5jZSAyMDA0LiBUaGUgd2F5IG91ciBzb2Z0d2FyZSBpcyBidWlsdCBhbGxvd3MgdXMgdG8gZXZvbHZlIG92ZXIgdGltZSBhbmQgZW1icmFjZSBjaGFuZ2luZyB0ZWNobm9sb2dpZXMg4oCTIGEgbXVzdCBoYXZlIHF1YWxpdHkgb2YgYW55IGNsb3VkIGJhc2VkIHBhcnRuZXIuIE91ciBjdXJyZW50IHN1aXRlIG9mIFJlcG9ydCBQYWwsIHZpY29NYXAgYW5kIFNlZU1vbnN0ZXIgY292ZXJzIGEgYnJvYWQgcmFuZ2Ugb2Ygc2tpIGFyZWEgbWFya2V0aW5nIGFuZCBvcGVyYXRpb25zIGFuZCBhbGxvd3MgeW91IHRvIGdldCBiYWNrIHRvIHdoYXTigJlzIGltcG9ydGFudCAobGlrZSB0YWtpbmcgYSBmZXcgcnVucyBvbiB5b3VyIGx1bmNoIGJyZWFrISkgR2V0IGluIHRvdWNoIHRvZGF5LCB3ZeKAmWQgbG92ZSB0byB0YWxrLiIsImxvZ28iOnsidXJsIjoiLy9pbWFnZXMuY29udGVudGZ1bC5jb20vNnA4b2h4ZmlrYWsxLzZydjJ0QnBZNXlpRVVveUlDdTBBNFcvNGFiOTE1MTM0MzY4Nzg5YzEzNDNjMzQ0NDAwNWUzYWEvcmVzb3J0c2ludGVyYWN0aXZlLnN2ZyIsIm5hbWUiOiJSZXNvcnRzIEludGVyYWN0aXZlIExvZ28ifSwiY29tcGFueURldGFpbFNlY3Rpb25zIjpbeyJpbWFnZSI6Ii8vaW1hZ2VzLmNvbnRlbnRmdWwuY29tLzZwOG9oeGZpa2FrMS82SW1WemxCWFNFaUtTZWVxZ0VRa3NnL2M3NDhhZjU3NDkxZjc4MDQ4NDUwMzhiNGM2YTE3N2E4L3Bvd2Rlcl9zaG90LmpwZyIsInRpdGxlIjoiUmVzb3J0cyBJbnRlcmFjdGl2ZSB3ZWJzaXRlIiwiYm9keSI6IiJ9LHsiaW1hZ2UiOiIvL2ltYWdlcy5jb250ZW50ZnVsLmNvbS82cDhvaHhmaWthazEvM3kwQWFQUE16Q0dLaXVLY011ZWEyUS9mNTJiNTc5ZGM5YTIwODBlNDg0OWVlODcyMjYxMjRjMi9RVC13ZWF0aGVyZm9yZWNhc3Qtc2NyZWVuLmpwZyIsInRpdGxlIjoiV2hhdCBzZXRzIHVzIGFwYXJ0PyIsImJvZHkiOiJSZXNvcnRzIEludGVyYWN0aXZlIGhhcyBiZWVuIG1ha2luZyBjbG91ZCBzb2Z0d2FyZSBmb3IgdGhlIHNraSBpbmR1c3RyeSBzaW5jZSAyMDA1IHNvIHdlIGtub3cgYSB0aGluZyBvciB0d28gYWJvdXQgdGhlIHN1YmplY3QhIFRoZSB3YXkgb3VyIHNvZnR3YXJlIGlzIGJ1aWx0IGFsbG93cyB1cyB0byBldm9sdmUgb3ZlciB0aW1lIGFuZCBlbWJyYWNlIGNoYW5naW5nIHRlY2hub2xvZ2llcyDigJMgYSBtdXN0IGhhdmUgcXVhbGl0eSBvZiBhbnkgY2xvdWQgYmFzZWQgcGFydG5lci4gT3VyIGN1cnJlbnQgc3VpdGUgb2YgUmVwb3J0IFBhbCwgdmljb01hcCBhbmQgU2VlTW9uc3RlciBjb3ZlcnMgYSBicm9hZCByYW5nZSBvZiBza2kgYXJlYSBtYXJrZXRpbmcgYW5kIG9wZXJhdGlvbnMgYW5kIGFsbG93cyB5b3UgdG8gZ2V0IGJhY2sgdG8gd2hhdOKAmXMgaW1wb3J0YW50IChsaWtlIHRha2luZyBhIGZldyBydW5zIG9uIHlvdXIgbHVuY2ggYnJlYWshKSBbR2V0IGluIHRvdWNoIHRvZGF5LCB3ZeKAmWQgbG92ZSB0byB0YWxrLl0obWFpbHRvOmluZm9AcmVzb3J0cy1pbnRlcmFjdGl2ZS5jb20pIn0seyJpbWFnZSI6Ii8vaW1hZ2VzLmNvbnRlbnRmdWwuY29tLzZwOG9oeGZpa2FrMS80ZVJ3ZDkyZ293b21NS0FZT2dnY3cwLzlmODNjMmYyYjJhN2VhZWIxMzJhOWRmZTYwNTA5YmNhL0RldmljZXMuanBnIiwidGl0bGUiOiJDbGV2ZXIgU29mdHdhcmUgTWFraW5nIExpZmUgRWFzeSIsImJvZHkiOiItIFlvdSB3b3JrIGluIHRoZSBza2kgaW5kdXN0cnkgYmVjYXVzZSB5b3UgbG92ZSBpdCwgc28gd2UgYnVpbGQgc29mdHdhcmUgdG8gc2F2ZSB5b3UgdGltZSBhbmQgZ2V0IHlvdSBiYWNrIG9uIHRoZSBoaWxsXG4tIENsb3VkIGJhc2VkIHNvZnR3YXJlIGlzIGRlc2lnbmVkIHRvIGJlIHVzZWQgYW55d2hlcmUg4oCTIGRlc2t0b3AsIG1vYmlsZSwgQ29sb3JhZG8sIFRpbWJ1a3R1LiBJZiB5b3UgY2FuIGdldCBhbiBJbnRlcm5ldCBjb25uZWN0aW9uLCB3ZeKAmXZlIGdvdCB5b3UgY292ZXJlZFxuLSBTaW1wbGljaXR5IGFuZCBzdGFiaWxpdHkgZm9ybSBhIGNvcmUgcGFydCBvZiBvdXIgc29mdHdhcmUgYXJjaGl0ZWN0dXJlLiBPdXIgcHJvZHVjdHMgYXJlIGhvc3RlZCBvbiBBbWF6b24gV2ViIFNlcnZpY2VzIGFuZCBtYWtlIHVzZSBvZiB0aGVpciBiZXN0IGFuZCBsYXRlc3QgdGVjaG5vbG9naWVzIGxpa2UgQ2xvdWRGcm9udCwgQXVyb3JhLCBhbmQgRWxhc3RpYyBCZWFuc3RhbGsgdG8gbWFrZSBzdXJlIHdl4oCZcmUgYWx3YXlzIGZhc3QgYW5kIGF2YWlsYWJsZVxuLSBJbmNsdWRlIGxpdmUgZGF0YSBhbmQgaW1hZ2VzIGZyb20gc29jaWFsIG1lZGlhLCB3ZWF0aGVyLCBuZXdzIGFuZCBvdGhlciB3ZWJzaXRlc1xuLSBVcGxvYWQgdmlkZW8gaW4gYW55IGZvcm1hdCBhbmQgaXTigJlsbCBiZSBjb252ZXJ0ZWQgZm9yIHlvdSJ9XSwiaWNvbiI6eyJzeXMiOnsic3BhY2UiOnsic3lzIjp7InR5cGUiOiJMaW5rIiwibGlua1R5cGUiOiJTcGFjZSIsImlkIjoiNnA4b2h4ZmlrYWsxIn19LCJpZCI6ImttRzBYM2ZGUWNFc2VpbWNlVWtJcyIsInR5cGUiOiJBc3NldCIsImNyZWF0ZWRBdCI6IjIwMTctMDYtMThUMTA6MjQ6NTQuNTgwWiIsInVwZGF0ZWRBdCI6IjIwMTctMDYtMThUMTA6MjQ6NTQuNTgwWiIsInJldmlzaW9uIjoxLCJsb2NhbGUiOiJlbi1OWiJ9LCJmaWVsZHMiOnsidGl0bGUiOiJTZW1pLWZsYWtlLXBuZyIsImRlc2NyaXB0aW9uIjoiUE5HIHZlcnNpb24gb2Ygc2VtaS1mbGFrZSIsImZpbGUiOnsidXJsIjoiLy9pbWFnZXMuY29udGVudGZ1bC5jb20vNnA4b2h4ZmlrYWsxL2ttRzBYM2ZGUWNFc2VpbWNlVWtJcy85NDNjMDQ3OTFhMmQ0NDJmMWY1MDgwMmEzODY4ZTI5ZS9zZW1pZmxha2UucG5nIiwiZGV0YWlscyI6eyJzaXplIjoyNDE5MCwiaW1hZ2UiOnsid2lkdGgiOjUxMiwiaGVpZ2h0Ijo1MTJ9fSwiZmlsZU5hbWUiOiJzZW1pZmxha2UucG5nIiwiY29udGVudFR5cGUiOiJpbWFnZS9wbmcifX19fX0=')
      let halfcabModule = await import('./halfcab')
      ;({
        ssr,
        html,
        defineRoute,
        gotoRoute,
        formField,
        cache,
        updateState,
        injectMarkdown,
        formIsValid,
        css,
        getRouteComponent,
        nextTick
      } = halfcabModule)
      halfcab = halfcabModule.default
    })

    it('Produces an HTML element when rendering', () => {
      let el = html`
         <div oninput=${() => {
      }}></div>
      `
      expect(el instanceof HTMLDivElement).to.be.true()
    })

    it('Produces an HTML element wrapping as a reusable component', () => {
      let el = args => html`
          <div oninput=${() => {
      }}></div>
      `
      expect(el({}) instanceof HTMLDivElement).to.be.true()
    })

    it('Runs halfcab function without error', () => {
      return halfcab({
        el: '#root',
        components () {
          return html `<div></div>`
        }
      })
        .then(rootEl => {
          expect(typeof rootEl === 'object').to.be.true()
        })
    })

    it('updating state causes a rerender with state', (done) => {
      halfcab({
        components (args) {
          return html`<div>${args.testing || ''}</div>`
        }
      })
        .then(({rootEl, state}) => {
          updateState({testing: 'works'})
          nextTick(()=> {
            expect(rootEl.innerHTML.includes('works')).to.be.true()
            done()
          })

        })
    })

    it('updates state without merging arrays when told to', () => {
      return halfcab({
        components () {
          return html `<div></div>`
        }
      })
        .then(({rootEl, state}) => {
          updateState({
            myArray: ['1', '2', '3']
          })

          updateState({
            myArray: ['4']
          }, {
            arrayMerge: false
          })
          expect(state.myArray.length).to.equal(1)
        })

    })

    it('updating state without deepmerge overwrites objects', () => {
      var style = css`
                .myStyle {
                    width: 100px;
                }
            `
      return halfcab({
        components (args) {
          return html `<div class="${style.myStyle}">${args.testing.inner || ''}</div>`
        }
      })
        .then(({rootEl, state}) => {
          updateState({testing: {inner: 'works'}})
          updateState({testing: {inner2: 'works'}}, {
            deepMerge: false
          })
          expect(rootEl.innerHTML.indexOf('works')).to.equal(-1)
        })
    })

    it('injects external content without error', () => {
      return halfcab({
        components (args) {
          return html `<div>${injectMarkdown('### Heading')}</div>`
        }
      })
        .then(({rootEl, state}) => {
          expect(rootEl.innerHTML.indexOf('###')).to.equal(-1)
          expect(rootEl.innerHTML.indexOf('<h3')).not.to.equal(-1)
        })
    })

    it('injects markdown without wrapper without error', () => {
      return halfcab({
        components (args) {
          return html `<div>${injectMarkdown('### Heading', {wrapper: false})}</div>`
        }
      })
        .then(({rootEl, state}) => {
          expect(rootEl.innerHTML.indexOf('###')).to.equal(-1)
          expect(rootEl.innerHTML.indexOf('<h3')).not.to.equal(-1)
        })
    })

    describe('formField', () => {

      it('Returns a function', () => {
        var holdingPen = {}
        var output = formField(holdingPen, 'test')

        expect(typeof output === 'function').to.be.true()
      })

      it('Sets a property within the valid object of the same name', () => {
        var holdingPen = {}
        var output = formField(holdingPen, 'test')
        var e = {
          currentTarget: {
            type: 'text',
            validity: {
              valid: false
            }
          }
        }
        output(e)

        let validFound
        Object.getOwnPropertySymbols(holdingPen).forEach(symb => {
          if (symb.toString().indexOf('Symbol(valid)') === 0 && holdingPen[symb] !== undefined) {
            validFound = symb
          }
        })

        expect(validFound).to.exist()
      })

      it('Runs OK if a valid object is already present', () => {
        var holdingPen = {valid: {}}
        var output = formField(holdingPen, 'test')
        var e = {
          currentTarget: {
            type: 'text',
            validity: {
              valid: false
            }
          }
        }
        output(e)

        expect(holdingPen.valid.test).to.exist()
      })

      it('Sets checkboxes without error', () => {
        var holdingPen = {}
        var output = formField(holdingPen, 'test')
        var e = {
          currentTarget: {
            type: 'checkbox',
            validity: {
              valid: false
            },
            checked: true
          }
        }
        output(e)

        let validFound
        Object.getOwnPropertySymbols(holdingPen).forEach(symb => {
          if (symb.toString().indexOf('Symbol(valid)') === 0 && holdingPen[symb] !== undefined) {
            validFound = symb
          }
        })

        expect(validFound).to.exist()
      })

      it('Sets radio buttons without error', () => {
        var holdingPen = {}
        var output = formField(holdingPen, 'test')
        var e = {
          currentTarget: {
            type: 'radio',
            validity: {
              valid: false
            },
            checked: true
          }
        }
        output(e)

        let validFound
        Object.getOwnPropertySymbols(holdingPen).forEach(symb => {
          if (symb.toString().indexOf('Symbol(valid)') === 0 && holdingPen[symb] !== undefined) {
            validFound = symb
          }
        })

        expect(validFound).to.exist()
      })

      it('Validates a form without error', () => {
        var holdingPen = {
          test: '',
          [Symbol('valid')]: {
            test: false
          }
        }
        var output = formField(holdingPen, 'test')
        var e = {
          currentTarget: {
            type: 'radio',
            validity: {
              valid: true
            },
            checked: true
          }
        }
        output(e)

        expect(formIsValid(holdingPen)).to.be.true()
      })

      it('Validates when valid object already present', () => {
        var holdingPen = {
          test: '',
          [Symbol('valid')]: {
            test: false
          },
          valid: {}
        }
        var output = formField(holdingPen, 'test')
        var e = {
          currentTarget: {
            type: 'radio',
            validity: {
              valid: true
            },
            checked: true
          }
        }
        output(e)

        expect(formIsValid(holdingPen)).to.be.true()
      })
    })

    describe('routing', () => {
      let windowStub
      after(() => {
        windowStub.restore()
      })
      before(() => {
        windowStub = sinon.stub(window.history, 'pushState')
      })

      it('Makes the route available when using defineRoute', () => {

        defineRoute({
          path: '/testFakeRoute', title: 'Report Pal', callback: output => {
            updateState({
              showContact: true
            })
          }
        })

        return halfcab({
          components () {
            return html `<div></div>`
          }
        })
          .then(rootEl => {

            let routing = () => {
              gotoRoute('/testFakeRoute')
            }
            expect(routing).to.not.throw()//made it out of the try catch, must
                                          // be fine
          })

      })

      it(`Throws an error when a route doesn't exist`, () => {

        return halfcab({
          components () {
            return html `<div></div>`
          }
        })
          .then(rootEl => {
            let routing = () => {
              gotoRoute('/thisIsAFakeRoute')
            }
            expect(routing).to.throw()//made it out of the try catch, must be
                                      // fine
          })

      })
    })

    it('has initial data injects router when its not there to start with', () => {
      defineRoute({path: '/routeWithComponent', component: {fakeComponent: true}})
      expect(getRouteComponent('/routeWithComponent').fakeComponent)
        .to
        .be
        .true()
    })

    it(`Doesn't clone when merging`, (done) => {
      halfcab({
        components () {
          return html `<div></div>`
        }
      })
        .then(({rootEl, state}) => {
          let myObject = {
            test: 1,
            fake: 'String2'
          }
          updateState({
            myObject
          })

          nextTick(() => {
            state.myObject.test = 2
            updateState({
              myOtherObject: {
                test: 1,
                fake: 'String2'
              }
            })

            nextTick(() => {
              expect(state.myObject.test).to.equal(2)
              expect(myObject.test).to.equal(2)
              done()
            }, 20)
          })
        })
    })
  })
})
