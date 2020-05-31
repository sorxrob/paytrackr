<template>
  <div>
    <div v-if="items.length">
      <v-card flat>
        <v-card-title>
          <span>{{total | scale }} {{showInXRP ? 'XRP' : 'USD'}}</span>
          <v-spacer></v-spacer>
          <v-btn
            v-if="false"
            text
            @click="showInXRP = !showInXRP"
          >Show in {{ showInXRP ? 'USD' : 'XRP' }}</v-btn>
        </v-card-title>
        <v-card-subtitle>Total Payments</v-card-subtitle>
        <v-card-text>
          <Doughnut :options="options" :chart-data="chartData" :height="200" />
        </v-card-text>
      </v-card>
    </div>
    <tab-placeholder v-else>
      <h4>No payments found.</h4>
      <p>Start supporting content creators by visiting their site!</p>
    </tab-placeholder>
    <v-list three-line subheader v-show="items.length">
      <v-subheader>Websites Visited</v-subheader>
      <template v-for="(i, idx) in itemsWithCalculatedCurrencies">
        <v-divider inset :key="idx" v-if="idx !== 0"></v-divider>
        <v-list-item :key="i.hostname">
          <v-list-item-avatar>
            <v-icon :style="{ color: i.color }">
              {{
              `mdi-alpha-${i.hostname.charAt(0)}-circle`
              }}
            </v-icon>
          </v-list-item-avatar>
          <v-list-item-content>
            <v-list-item-title>{{ i.hostname === 'paytrackr-developer.now.sh' ? 'PayTrackr Developer ❤️' : i.hostname }}</v-list-item-title>
            <v-list-item-subtitle>{{i.total | scale(i.assetScale)}} {{showInXRP ? 'XRP' : 'USD'}}</v-list-item-subtitle>
            <v-list-item-subtitle>
              Last payment:
              {{ i.lastUpdate | filterDate }}
            </v-list-item-subtitle>
          </v-list-item-content>
          <v-list-item-action>
            <v-btn
              icon
              @click="
                selectedWebsite = i;
                websiteInfoDialog = true;
              "
            >
              <v-icon>mdi-information</v-icon>
            </v-btn>
          </v-list-item-action>
        </v-list-item>
      </template>
    </v-list>
    <!-- Dialog -->
    <v-dialog v-model="websiteInfoDialog">
      <v-card>
        <v-card-title>
          Payment Summary
          <v-spacer></v-spacer>
          <v-btn icon @click="websiteInfoDialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text>
          <div class="d-flex justify-center" v-if="websiteInfoLoading">
            <v-progress-circular :size="50" color="primary" indeterminate></v-progress-circular>
          </div>
          <v-list three-line>
            <template v-for="(value, name, idx) in websiteUrls">
              <v-divider inset :key="idx" v-if="idx !== 0"></v-divider>
              <v-list-item :key="name">
                <v-list-item-avatar>
                  <v-icon>mdi-contactless-payment</v-icon>
                </v-list-item-avatar>
                <v-list-item-content>
                  <v-list-item-title>{{ value.total | scale(value.assetScale) }} {{ showInXRP ? 'XRP' : 'USD' }}</v-list-item-title>
                  <v-list-item-subtitle>
                    <a :href="name" target="_BLANK" v-text="name"></a>
                  </v-list-item-subtitle>
                  <v-list-item-subtitle>
                    Last payment:
                    {{ value.lastUpdate | filterDate }}
                  </v-list-item-subtitle>
                </v-list-item-content>
                <v-list-item-action v-show="!name.includes(iframeUrl)">
                  <v-tooltip left>
                    <template v-slot:activator="{ on }">
                      <v-btn icon @click="toggleDisableSite(name)" v-on="on">
                        <v-icon
                          :color="`${disabledSites[name] ? 'grey' : 'green lighten-1'}`"
                        >{{ disabledSites[name] ? 'mdi-cash-usd-outline' : 'mdi-cash-usd' }}</v-icon>
                      </v-btn>
                    </template>
                    <span>Click to {{ disabledSites[name] ? 'enable monetization' : 'disable monetization' }}</span>
                  </v-tooltip>
                </v-list-item-action>
              </v-list-item>
            </template>
          </v-list>
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import Doughnut from '../components/Doughnut';
import { getRecords, getTotalForEachAssetCode, setRecords } from '../utils';
import BigNumber from 'bignumber.js';
BigNumber.config({ DECIMAL_PLACES: 9 });
import config from '../config';

export default {
  props: ['xrpInUSD', 'showInXRP', 'items'],
  components: {
    Doughnut
  },
  data: () => ({
    options: {
      legend: {
        display: false
      },
      tooltips: {
        callbacks: {
          title: function(tooltipItem, data) {
            return data['labels'][tooltipItem[0]['index']];
          },
          label: function(tooltipItem, data) {
            return data['datasets'][0]['data'][tooltipItem['index']];
          }
        }
      },
      hover: {
        animationDuration: 0
      },
      animation: {
        duration: 0
      },
      responsive: true,
      maintainAspectRatio: false
    },
    selectedWebsite: {},
    selectedWebsiteUrls: [],
    websiteInfoDialog: false,
    websiteInfoLoading: false,
    disabledSites: {}
  }),
  methods: {
    async toggleDisableSite(val) {
      if (val === 'undefined') {
        this.disabledSites[val] = true;
      } else {
        this.disabledSites[val] = !this.disabledSites[val];
      }
      setRecords('paytrackr_disabled_sites', this.disabledSites);
      const tabs = await this.$browser.tabs.query({});
      tabs
        .filter(tab => tab.url === val)
        .map(tab => {
          return this.$browser.tabs.sendMessage(tab.id, {
            enableMonetization: !this.disabledSites[val]
          });
        });
    }
  },
  computed: {
    itemsWithCalculatedCurrencies() {
      return getTotalForEachAssetCode(
        this.items,
        this.showInXRP,
        this.xrpInUSD
      ).sort((a, b) => b.lastUpdate - a.lastUpdate);
    },
    chartData() {
      return {
        labels: this.itemsWithCalculatedCurrencies
          .sort((a, b) => a.hostname.localeCompare(b.hostname))
          .map(i => i.hostname),
        datasets: [
          {
            data: this.itemsWithCalculatedCurrencies.map(i => i.total),
            backgroundColor: this.itemsWithCalculatedCurrencies.map(
              i => i.color
            )
          }
        ]
      };
    },
    total() {
      return this.itemsWithCalculatedCurrencies.reduce(
        (a, b) => a + +b.total,
        0
      );
    },
    websiteUrls() {
      let urlMap = {};
      for (var i = 0; i < this.selectedWebsiteUrls.length; i++) {
        const item = this.selectedWebsiteUrls[i];
        if (this.showInXRP && item.assetCode === 'USD') {
          const total = item.scaledAmount * (1 / this.xrpInUSD);
          urlMap[item.url] = {
            total: total,
            assetCode: item.assetCode,
            assetScale: item.assetScale,
            lastUpdate: item.date
          };
        } else if (!this.showInXRP && item.assetCode === 'XRP') {
          const total = item.scaledAmount * this.xrpInUSD;
          urlMap[item.url] = {
            total: total,
            assetCode: item.assetCode,
            assetScale: item.assetScale,
            lastUpdate: item.date
          };
        } else {
          urlMap[item.url] = {
            total: item.scaledAmount,
            assetCode: item.assetCode,
            assetScale: item.assetScale,
            lastUpdate: item.date
          };
        }
      }
      return urlMap;
    },
    iframeUrl() {
      return config.iframeUrl || '';
    }
  },
  watch: {
    async websiteInfoDialog(val) {
      if (val) {
        this.websiteInfoLoading = true;
        const [items, disabledSites] = await Promise.all([
          getRecords('paytrackr_history'),
          getRecords('paytrackr_disabled_sites', {})
        ]);
        this.selectedWebsiteUrls = items.filter(i =>
          i.url.includes(this.selectedWebsite.hostname)
        );
        this.disabledSites = disabledSites;
        this.websiteInfoLoading = false;
      } else {
        this.selectedWebsiteUrls = [];
      }
    }
  }
};
</script>
